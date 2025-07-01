/**
 * Claude.ai 风格的代码复制功能
 */

(function() {
    'use strict';

    // 等待 DOM 加载完成
    document.addEventListener('DOMContentLoaded', function() {
        addCopyButtonsToCodeBlocks();
    });

    function addCopyButtonsToCodeBlocks() {
        // 查找所有代码块
        const codeBlocks = document.querySelectorAll('.highlight, pre');
        
        codeBlocks.forEach(function(codeBlock) {
            // 避免重复添加按钮
            if (codeBlock.querySelector('.copy-button')) {
                return;
            }

            // 创建复制按钮
            const copyButton = createCopyButton();
            
            // 设置按钮位置
            codeBlock.style.position = 'relative';
            codeBlock.appendChild(copyButton);

            // 绑定点击事件
            copyButton.addEventListener('click', function() {
                copyCodeToClipboard(codeBlock, copyButton);
            });
        });
    }

    function createCopyButton() {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = `
            <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="m5 15-4-4 4-4"></path>
                <path d="M11 19V5"></path>
            </svg>
        `;
        button.setAttribute('title', '复制代码');
        
        // 按钮样式
        Object.assign(button.style, {
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            padding: '6px',
            border: 'none',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ccc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: '0.7',
            zIndex: '10',
            fontSize: '0',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        });

        // 悬停效果
        button.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.background = 'rgba(255, 255, 255, 0.15)';
            this.style.color = '#fff';
        });

        button.addEventListener('mouseleave', function() {
            this.style.opacity = '0.7';
            this.style.background = 'rgba(255, 255, 255, 0.1)';
            this.style.color = '#ccc';
        });

        return button;
    }

    function copyCodeToClipboard(codeBlock, button) {
        // 获取代码文本
        let codeText = '';
        
        // 尝试从 .code pre 中获取代码（带行号的情况）
        const codeElement = codeBlock.querySelector('.code pre');
        if (codeElement) {
            codeText = codeElement.textContent || codeElement.innerText;
        } else {
            // 直接从 pre 中获取代码
            const preElement = codeBlock.querySelector('pre') || codeBlock;
            codeText = preElement.textContent || preElement.innerText;
        }

        // 清理代码文本
        codeText = codeText.trim();

        // 复制到剪贴板
        if (navigator.clipboard && window.isSecureContext) {
            // 现代浏览器的 Clipboard API
            navigator.clipboard.writeText(codeText).then(function() {
                showCopySuccess(button);
            }).catch(function(err) {
                console.error('复制失败:', err);
                fallbackCopyTextToClipboard(codeText, button);
            });
        } else {
            // 回退方案
            fallbackCopyTextToClipboard(codeText, button);
        }
    }

    function fallbackCopyTextToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // 避免影响页面布局
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess(button);
            } else {
                showCopyError(button);
            }
        } catch (err) {
            console.error('复制失败:', err);
            showCopyError(button);
        }
        
        document.body.removeChild(textArea);
    }

    function showCopySuccess(button) {
        const originalHTML = button.innerHTML;
        
        // 显示成功图标
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        button.style.color = '#22c55e';
        button.setAttribute('title', '已复制！');
        
        // 2秒后恢复原状
        setTimeout(function() {
            button.innerHTML = originalHTML;
            button.style.color = '#ccc';
            button.setAttribute('title', '复制代码');
        }, 2000);
    }

    function showCopyError(button) {
        const originalHTML = button.innerHTML;
        
        // 显示错误图标
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `;
        button.style.color = '#f43f5e';
        button.setAttribute('title', '复制失败');
        
        // 2秒后恢复原状
        setTimeout(function() {
            button.innerHTML = originalHTML;
            button.style.color = '#ccc';
            button.setAttribute('title', '复制代码');
        }, 2000);
    }

    // 修复图标 SVG
    function fixCopyButtonIcon() {
        const copyButtons = document.querySelectorAll('.copy-button');
        copyButtons.forEach(function(button) {
            const svg = button.querySelector('svg');
            if (svg) {
                svg.innerHTML = `
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                `;
            }
        });
    }

    // 确保图标正确显示
    setTimeout(fixCopyButtonIcon, 100);
})(); 