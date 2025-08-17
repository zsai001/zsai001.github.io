---
title: Ubuntu 24.04 使用 kubeadm 安装 Kubernetes 完整指南 (大陆网络环境优化版)
date: 2025-07-19 10:38:57
tags:
---

## 前置条件

- Ubuntu 24.04 服务器
- 至少 2GB 内存
- 至少 2 CPU 核心
- 网络连接正常
- 具有 sudo 权限的用户
- **可用的 socks5 代理服务器** (用于镜像下载)

## 步骤 1： 设置代理

### socks5 代理配置详解

#### 确认代理服务器信息

```bash
# 假设您的代理信息为：
# 代理服务器: 192.168.100.63
# 端口: 7890
```

#### 系统级代理配置

```bash
# 配置系统环境变量
cat <<EOF | sudo tee -a /etc/environment
HTTP_PROXY=socks5://192.168.100.63:7890
HTTPS_PROXY=socks5://192.168.100.63:7890
NO_PROXY=localhost,127.0.0.1,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12
http_proxy=socks5://192.168.100.63:7890
https_proxy=socks5://192.168.100.63:7890
no_proxy=localhost,127.0.0.1,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12
EOF

# 使环境变量生效
source /etc/environment
```

#### apt 代理配置

```bash
# 配置 apt 使用代理
cat <<EOF | sudo tee /etc/apt/apt.conf.d/95proxies
Acquire::http::Proxy "socks5h://192.168.100.63:7890";
Acquire::https::Proxy "socks5h://192.168.100.63:7890";
EOF
```

#### curl 和 wget 代理配置

```bash
# 配置用户级代理
cat <<EOF >> ~/.bashrc
export HTTP_PROXY=socks5://192.168.100.63:7890
export HTTPS_PROXY=socks5://192.168.100.63:7890
export NO_PROXY=localhost,127.0.0.1,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12
EOF

source ~/.bashrc
```

### 代理故障排除

```bash
# 检查代理连接
nc -v 192.168.100.63 7890

# 检查服务状态
sudo systemctl status docker
sudo systemctl status containerd

# 查看服务环境变量
sudo systemctl show docker --property=Environment
sudo systemctl show containerd --property=Environment

# 重置网络配置 (如果需要)
sudo systemctl daemon-reload
sudo systemctl restart networking
sudo systemctl restart docker
sudo systemctl restart containerd
```

## 步骤 2: 系统准备

### 2.1 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 禁用 swap

```bash
# 临时禁用
sudo swapoff -a

# 永久禁用 (编辑 fstab)
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
```

### 2.3 配置内核模块

```bash
# 加载必要的内核模块
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
```

### 2.4 配置系统参数

```bash
# 设置内核参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 应用参数
sudo sysctl --system
```

## 步骤 3: 安装容器运行时 (containerd)

### 3.1 如果需要 docker 命令，可以安装 docker.io

```bash
# 完全清理所有 containerd 和 docker 相关包
sudo apt remove -y docker docker-engine docker.io containerd runc containerd.io
sudo apt autoremove -y
sudo apt autoclean

# 使用官方安装脚本重新安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 检查 containerd 状态
sudo systemctl status containerd
sudo systemctl status docker

# 如果 containerd 没有运行，手动启动
sudo systemctl start containerd
sudo systemctl enable containerd
```

### 3.1.1 配置 Docker 代理

```bash
# 创建 Docker 系统服务目录
sudo mkdir -p /etc/systemd/system/docker.service.d

# 配置 Docker 代理 (请替换为您的代理地址)
cat <<EOF | sudo tee /etc/systemd/system/docker.service.d/proxy.conf
[Service]
Environment="HTTP_PROXY=socks5://192.168.100.63:7890"
Environment="HTTPS_PROXY=socks5://192.168.100.63:7890"
Environment="NO_PROXY=localhost,127.0.0.1,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12"
EOF

# 重新加载系统配置并重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证代理配置
sudo systemctl show docker --property=Environment
```

### 3.2 如果不需要 docker 命令，可以只安装containerd

```bash
# 安装必要的包
sudo apt install -y apt-transport-https ca-certificates curl gpg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新包索引并安装 containerd
sudo apt update
sudo apt install -y containerd.io
```

### 3.2.1 配置 containerd

```bash
# 生成默认配置
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# 配置使用 systemd cgroup driver
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# 重启并启用 containerd
sudo systemctl restart containerd
sudo systemctl enable containerd
```

### 3.2.2 配置 containerd 代理

```bash
# 创建 containerd 系统服务目录
sudo mkdir -p /etc/systemd/system/containerd.service.d

# 配置 containerd 代理
cat <<EOF | sudo tee /etc/systemd/system/containerd.service.d/proxy.conf
[Service]
Environment="HTTP_PROXY=socks5://192.168.100.63:7890"
Environment="HTTPS_PROXY=socks5://192.168.100.63:7890"
Environment="NO_PROXY=localhost,127.0.0.1,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12"
EOF

# 重新加载系统配置并重启 containerd
sudo systemctl daemon-reload
sudo systemctl restart containerd

# 验证代理配置
sudo systemctl show containerd --property=Environment
```

## 步骤 4: 安装 kubeadm, kubelet, kubectl

### 4.1 添加 Kubernetes 仓库

```bash
# 创建密钥目录 (Ubuntu 24.04 已默认存在，但确保存在)
sudo mkdir -p -m 755 /etc/apt/keyrings

# 添加 Kubernetes 官方 GPG 密钥
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.33/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# 添加 Kubernetes 仓库 (v1.33 是当前稳定版本)
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.33/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
```

**重要说明：**

- 新的 Kubernetes 仓库位于 `pkgs.k8s.io`（社区托管）
- 旧的 Google 托管仓库 `apt.kubernetes.io` 已于 2024年3月4日停用
- 每个 Kubernetes 次要版本都有独立的仓库
- 如需其他版本，请将 URL 中的 `v1.33` 替换为所需版本

### 4.2 安装 Kubernetes 组件

```bash
# 更新包索引
sudo apt update

# 安装 kubeadm, kubelet, kubectl
sudo apt install -y kubelet kubeadm kubectl

# 锁定版本防止自动更新
sudo apt-mark hold kubelet kubeadm kubectl

# 启用 kubelet
sudo systemctl enable --now kubelet
```

## 步骤 5: 初始化 Kubernetes 集群 (仅在主节点执行)

### 5.1 创建 kubeadm 配置文件

```bash
# 创建 kubeadm 配置文件
cat <<EOF | sudo tee /etc/kubernetes/kubeadm-config.yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: $(hostname -I | awk '{print $1}')  # 自动获取本机IP
  bindPort: 6443
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: v1.33.0
clusterName: kubernetes
controlPlaneEndpoint: "$(hostname -I | awk '{print $1}'):6443"
networking:
  serviceSubnet: "10.96.0.0/12"
  podSubnet: "10.244.0.0/16"  # 适用于 Flannel
  dnsDomain: "cluster.local"
# 如果使用 Calico，请改为：
# networking:
#   serviceSubnet: "10.96.0.0/12"
#   podSubnet: "192.168.0.0/16"
#   dnsDomain: "cluster.local"
imageRepository: registry.k8s.io  # 使用官方镜像源
# 国内用户也可以选择阿里云镜像源：
# imageRepository: registry.aliyuncs.com/google_containers
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: KubeletConfiguration
cgroupDriver: systemd
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
EOF
```

### 5.2 初始化集群

```bash
# 使用配置文件初始化集群
sudo kubeadm init --config=/etc/kubernetes/kubeadm-config.yaml

# 如果镜像已预下载，初始化应该很快完成
# 如果遇到镜像拉取问题，可以使用以下命令重试：
# sudo kubeadm reset
# sudo kubeadm init --config=/etc/kubernetes/kubeadm-config.yaml --skip-phases=preflight
```

### 5.3 配置 kubectl (普通用户)

```bash
# 创建 .kube 目录
mkdir -p $HOME/.kube

# 复制配置文件
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config

# 设置文件权限
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 步骤 6: 安装网络插件

### 6.1 安装 Flannel (简单易用，推荐初学者)

```bash
# 直接从官方源安装
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

### 6.2 安装 Calico (功能丰富，支持网络策略)

```bash
# 安装 Tigera Operator
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.30.2/manifests/tigera-operator.yaml

# 创建自定义资源
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.30.2/manifests/custom-resources.yaml
```

### 6.3 验证网络插件安装

```bash
# 等待所有 Pod 启动
kubectl get pods -n kube-system -w

# 检查节点状态 (应该显示 Ready)
kubectl get nodes

# 检查网络插件 Pod 状态
kubectl get pods -n kube-system | grep -E "(flannel|calico)"
```

**网络插件选择建议：**

- **Flannel**: 简单易用，适合学习和小型集群，网络性能较好
- **Calico**: 功能丰富，支持网络策略，适合生产环境，安全性更高

## 步骤 7: 验证安装

### 7.1 检查节点状态

```bash
# 查看节点状态
kubectl get nodes

# 查看系统 pods 状态
kubectl get pods -n kube-system
```

### 7.2 如果是单节点集群，允许在主节点调度 pods

```bash
# 移除主节点的 taint (仅单节点集群)
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
```

## 步骤 8: 添加工作节点 (可选)

### 8.1 在工作节点上重复步骤 1-4 步骤

### 8.2 获取加入命令

```bash
# 在主节点执行，获取加入命令
kubeadm token create --print-join-command
```

### 8.3 在工作节点执行加入命令

```bash
# 在工作节点执行 (命令示例)
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```
