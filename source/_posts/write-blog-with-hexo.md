---
title: 使用Hexo写博客
date: 2025-07-01 21:13:58
tags: [Hexo, 博客, 静态网站, Node.js]
---

## 什么是 Hexo？

Hexo 是一个基于 Node.js 的快速、简洁且高效的静态博客框架。它支持 Markdown 语法，拥有丰富的插件生态，可以快速生成静态网站，非常适合技术博客和个人网站的搭建。

## 为什么选择 Hexo？

- **快速生成**：基于 Node.js，生成速度极快
- **Markdown 支持**：原生支持 Markdown 语法，写作体验优秀
- **主题丰富**：拥有大量免费主题可供选择
- **插件生态**：丰富的插件系统，功能扩展性强
- **部署简单**：支持 GitHub Pages、Netlify 等多种部署方式
- **SEO 友好**：生成的静态页面对搜索引擎友好

## 安装和配置

### 环境准备

首先确保你的系统已安装：
- Node.js (版本 12.0 或更高)
- Git

### 安装 Hexo

```bash
# 全局安装 Hexo CLI
npm install -g hexo-cli

# 创建新的博客项目
hexo init my-blog
cd my-blog

# 安装依赖
npm install
```

### 基本配置

编辑根目录下的 `_config.yml` 文件：

```yaml
# 网站信息
title: 我的博客
subtitle: 记录技术与生活
description: 分享编程经验和生活感悟
author: Your Name
language: zh-CN

# URL 配置
url: https://yourdomain.com
root: /

# 主题配置
theme: aircloud  # 或其他主题名称
```

## 写作流程

### 创建新文章

```bash
# 创建新文章
hexo new post "文章标题"

# 创建新页面
hexo new page "页面名称"
```

### 文章 Front Matter

每篇文章的开头都有 Front Matter，用于配置文章信息：

```yaml
---
title: 文章标题
date: 2025-01-01 12:00:00
tags: [标签1, 标签2]
categories: [分类1, 分类2]
excerpt: 文章摘要
---
```

### Markdown 语法技巧

Hexo 支持标准 Markdown 语法，还提供了一些扩展功能：

#### 代码块

```javascript
// 支持语法高亮
function hello() {
    console.log("Hello Hexo!");
}
```

#### 引用块

> 这是一个引用块示例

#### 标签插件

```
{% note info %}
这是一个信息提示框
{% endnote %}

{% codeblock lang:javascript %}
// 代码块示例
console.log('Hello World');
{% endcodeblock %}
```

## 本地预览和生成

### 本地预览

```bash
# 启动本地服务器
hexo server
# 或简写
hexo s

# 指定端口
hexo server -p 4000
```

访问 `http://localhost:4000` 即可预览博客。

### 生成静态文件

```bash
# 生成静态文件
hexo generate
# 或简写
hexo g

# 清理缓存后重新生成
hexo clean && hexo g
```

## 主题配置

### 选择主题

1. 从 [Hexo 主题库](https://hexo.io/themes/) 选择喜欢的主题
2. 下载主题到 `themes` 目录
3. 修改 `_config.yml` 中的 `theme` 配置

### 主题自定义

大多数主题都有自己的配置文件 `themes/主题名/_config.yml`，可以根据需要进行个性化配置：

- 导航菜单
- 社交链接
- 评论系统
- 统计代码
- 等等

## 部署博客

### GitHub Pages 部署

1. 创建 GitHub 仓库 `username.github.io`
2. 安装部署插件：

```bash
npm install hexo-deployer-git --save
```

3. 配置 `_config.yml`：

```yaml
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git
  branch: master
```

4. 部署：

```bash
hexo deploy
# 或简写
hexo d

# 生成并部署
hexo g -d
```

### 其他部署选项

- **Netlify**：拖拽部署，支持持续集成
- **Vercel**：简单快速的部署平台
- **自建服务器**：通过 FTP 或 rsync 部署

## 常用插件推荐

```bash
# SEO 优化
npm install hexo-generator-sitemap --save
npm install hexo-generator-baidu-sitemap --save

# RSS 订阅
npm install hexo-generator-feed --save

# 搜索功能
npm install hexo-generator-searchdb --save

# 图片处理
npm install hexo-renderer-marked --save
```

## 写作技巧和最佳实践

### 文章组织

- 使用有意义的分类和标签
- 保持文章结构清晰
- 添加合适的摘要

### 图片管理

```bash
# 启用 post_asset_folder
# 在 _config.yml 中设置
post_asset_folder: true
```

### SEO 优化

- 合理设置 title 和 description
- 使用语义化的 URL
- 添加合适的内链和外链

## 总结

Hexo 是一个功能强大且易用的静态博客框架，通过简单的 Markdown 写作就能生成美观的博客网站。结合 GitHub Pages 等免费托管服务，可以零成本搭建个人博客。

开始你的 Hexo 博客之旅吧！记住，最重要的是保持写作的习惯，内容比工具更重要。

---

*希望这篇指南能帮助你快速上手 Hexo 博客！如有问题，欢迎留言讨论。*


