import { Hono } from 'hono'
import { renderer } from './renderer'
import type { GitHubRepoData } from './types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(renderer)

// 首页 - 项目卡片生成器
app.get('/', async (c) => {
  const url = c.req.query('q') || 'wenyuanw/quick-prompt'
  let repoData: GitHubRepoData | null = null
  let error: string | null = null

  if (url) {
    try {
      // 解析 GitHub URL 或直接的 owner/repo 格式
      let owner: string, repo: string
      
      if (url.includes('github.com')) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
        if (!match) {
          throw new Error('无效的 GitHub URL')
        }
        owner = match[1]
        repo = match[2].replace(/\.git$/, '')
      } else {
        const parts = url.split('/')
        if (parts.length !== 2) {
          throw new Error('格式应为 owner/repo')
        }
        owner = parts[0]
        repo = parts[1]
      }

      // 准备API请求头
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Card-Generator/1.0'
      }
      
      // 如果有GitHub Token，添加认证头（可选）
      const token = c.env?.GITHUB_TOKEN
      if (token) {
        headers['Authorization'] = `token ${token}`
      }

      // 获取项目信息
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })

      if (!repoResponse.ok) {
        let errorMessage = '项目不存在或无法访问'
        
        if (repoResponse.status === 403) {
          const rateLimitRemaining = repoResponse.headers.get('X-RateLimit-Remaining')
          if (rateLimitRemaining === '0') {
            errorMessage = 'GitHub API 请求次数已达上限，请稍后再试'
          } else {
            errorMessage = '访问被拒绝，可能是私有仓库或需要认证'
          }
        } else if (repoResponse.status === 404) {
          errorMessage = '项目不存在，请检查项目名称是否正确'
        } else if (repoResponse.status >= 500) {
          errorMessage = 'GitHub 服务器暂时不可用，请稍后再试'
        }
        
        throw new Error(errorMessage)
      }
      repoData = await repoResponse.json() as GitHubRepoData
    } catch (e) {
      error = e instanceof Error ? e.message : '获取项目信息时出现错误'
    }
  }

  return c.render(
    <div class="container">
      <div class="hero">
        <h1>GitHub 项目卡片生成器</h1>
        <form class="search-form" method="get" action="/">
          <div class="input-group">
            <input 
              type="text" 
              name="q" 
              value={url || ''}
              placeholder="例：输入 microsoft/vscode 或完整 url"
              required
              class="url-input"
            />
            <button type="submit" class="search-btn">生成卡片</button>
          </div>
        </form>
        
        <div class="examples">
          <h3>试试这些热门项目：</h3>
          <div class="example-links">
            <a href="/?q=microsoft/vscode" class="example-link">VSCode</a>
            <a href="/?q=facebook/react" class="example-link">React</a>
            <a href="/?q=vercel/next.js" class="example-link">Next.js</a>
            <a href="/?q=honojs/hono" class="example-link">Hono</a>
          </div>
        </div>
      </div>

      {error && (
        <div class="error-message">
          <p>{error}</p>
        </div>
      )}

      {repoData && (
        <div class="card-container">
          <div 
            id="github-card" 
            class="github-card liquidGlass-wrapper" 
            onclick="openRepository(this.dataset.repo)"
            data-repo={repoData.full_name}
            style="cursor: pointer;"
            title={`点击访问 ${repoData.full_name} 的 GitHub 仓库`}
          >
            <div class="liquidGlass-effect"></div>
            <div class="liquidGlass-tint"></div>
            <div class="liquidGlass-shine"></div>
            <div class="liquidGlass-text">
              <div class="card-header">
                <div class="owner-avatar">
                  <img 
                    src={repoData.owner.avatar_url} 
                    alt={`${repoData.owner.login} 的头像`}
                    class="avatar-image"
                    loading="lazy"
                  />
                </div>
                <div class="repo-info">
                  <h2 class="repo-name">{repoData.full_name}</h2>
                  {repoData.description && (
                    <p class="repo-description">{repoData.description}</p>
                  )}
                </div>
              </div>

              <div class="card-stats">
                <div class="stat-item">
                  <span class="stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                  </span>
                  <span class="stat-value">{repoData.stargazers_count.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="18" cy="18" r="3"></circle>
                      <circle cx="6" cy="6" r="3"></circle>
                      <path d="M6 21V9a9 9 0 0 0 9 9"></path>
                    </svg>
                  </span>
                  <span class="stat-value">{repoData.forks_count.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </span>
                  <span class="stat-value">{repoData.watchers_count.toLocaleString()}</span>
                </div>
              </div>

              {/* 额外信息行 */}
              <div class="card-extra-info">
                {repoData.language && (
                  <div class="info-item">
                    <span class="info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="16,18 22,12 16,6"></polyline>
                        <polyline points="8,6 2,12 8,18"></polyline>
                      </svg>
                    </span>
                    <span class="info-text">{repoData.language}</span>
                  </div>
                )}
                {repoData.license && (
                  <div class="info-item">
                    <span class="info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                      </svg>
                    </span>
                    <span class="info-text">{repoData.license.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div class="card-actions" onclick="event.stopPropagation()">
            <button onclick="downloadCard(); event.stopPropagation();" class="action-btn download-btn">
              <span class="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </span>
              下载卡片
            </button>
            <button onclick="shareCard(); event.stopPropagation();" class="action-btn share-btn">
              <span class="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </span>
              分享链接
            </button>
          </div>
        </div>
      )}

      {/* GitHub 标志 - 右上角 */}  
      {repoData && (
        <a 
          href="https://github.com/wenyuanw/liquid-glass-github-repo-card"
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-logo"
          title={`访问该项目的 GitHub 仓库`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      )}

      <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js"></script>
      <script dangerouslySetInnerHTML={{
        __html: `
          // html-to-image is now available globally as htmlToImage

          // 检查库是否正确加载
          window.addEventListener('load', () => {
            if (typeof htmlToImage !== 'undefined') {
              console.log('✅ html-to-image 库加载成功');
              console.log('可用方法:', Object.keys(htmlToImage));
            } else {
              console.error('❌ html-to-image 库加载失败');
            }
          });

          // 创建导出容器函数 - 重新实现
          async function createExportContainer(originalCard, options) {
            // 获取原始卡片的尺寸
            const cardRect = originalCard.getBoundingClientRect();

            // 创建导出容器
            const container = document.createElement('div');
            container.style.cssText = \`
              position: absolute;
              top: 0;
              left: 0;
              z-index: -1;
              width: \${cardRect.width + options.padding * 2}px;
              height: \${cardRect.height + options.padding * 2}px;
              padding: \${options.padding}px;
              background: \${options.backgroundColor};
              box-sizing: border-box; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            \`;

            // 创建卡片的HTML副本，而不是克隆DOM节点
            const cardHTML = originalCard.outerHTML;
            container.innerHTML = cardHTML;

            // 获取容器中的卡片元素
            const cardInContainer = container.querySelector('#github-card');
            if (cardInContainer) {
              // 重置卡片的定位样式
              cardInContainer.style.position = 'relative';
              cardInContainer.style.top = 'auto';
              cardInContainer.style.left = 'auto';
              cardInContainer.style.margin = '0';
              cardInContainer.style.transform = 'none';
            }

            return container;
          }

          // 等待图片加载完成
          async function waitForImages(container) {
            const images = container.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
              if (img.complete && img.naturalHeight !== 0) {
                return Promise.resolve();
              }
              return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // 即使图片加载失败也继续
                // 设置超时，避免无限等待
                setTimeout(resolve, 2000);
              });
            });

            await Promise.all(imagePromises);
          }

          // 全局 loading 管理
          function showGlobalLoading(message = '处理中...') {
            // 移除已存在的 loading
            hideGlobalLoading();

            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'global-loading-overlay';
            loadingOverlay.style.cssText = \`
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.7);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 99999;
              backdrop-filter: blur(5px);
              opacity: 0;
              transition: opacity 0.3s ease;
            \`;

            loadingOverlay.innerHTML = \`
              <div style="
                background: rgba(255, 255, 255, 0.95);
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                max-width: 300px;
                width: 90%;
              ">
                <div style="
                  width: 50px;
                  height: 50px;
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #667eea;
                  border-radius: 50%;
                  animation: globalSpin 1s linear infinite;
                  margin: 0 auto 20px;
                "></div>
                <div style="
                  color: #333;
                  font-size: 16px;
                  font-weight: 500;
                  margin-bottom: 8px;
                " id="global-loading-message">\${message}</div>
                <div style="
                  color: #666;
                  font-size: 14px;
                  line-height: 1.4;
                ">请稍候，正在处理您的请求...</div>
              </div>
            \`;

            document.body.appendChild(loadingOverlay);

            // 触发动画
            setTimeout(() => {
              loadingOverlay.style.opacity = '1';
            }, 10);

            return loadingOverlay;
          }

          function updateGlobalLoadingMessage(message) {
            const messageElement = document.getElementById('global-loading-message');
            if (messageElement) {
              messageElement.textContent = message;
            }
          }

          function hideGlobalLoading() {
            const existingOverlay = document.getElementById('global-loading-overlay');
            if (existingOverlay) {
              existingOverlay.style.opacity = '0';
              setTimeout(() => {
                if (existingOverlay.parentNode) {
                  existingOverlay.parentNode.removeChild(existingOverlay);
                }
              }, 300);
            }
          }

          // 使用 html-to-image 库导出
          async function downloadCardByHtmlToImage() {
            const card = document.getElementById('github-card');
            const downloadBtn = document.querySelector('.download-btn');

            // 显示按钮加载状态
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<span class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></span>准备导出...';
            downloadBtn.disabled = true;

            try {
              // 提供导出选项
              const exportOptions = await showExportOptions();
              if (!exportOptions) {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
                return;
              }

              // 显示全局 loading
              showGlobalLoading('准备导出图片...');

              downloadBtn.innerHTML = '<span class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></span>生成图片中...';

              // 更新 loading 消息
              updateGlobalLoadingMessage('创建导出容器...');

              // 创建导出容器
              const exportContainer = await createExportContainer(card, exportOptions);

              // 将容器临时添加到页面中进行渲染
              document.body.appendChild(exportContainer);

              // 更新 loading 消息
              updateGlobalLoadingMessage('等待图片加载...');

              // 等待图片加载和样式应用
              await waitForImages(exportContainer);
              await new Promise(resolve => setTimeout(resolve, 100)); // 额外等待时间确保渲染完成

              // 更新 loading 消息
              updateGlobalLoadingMessage('配置导出参数...');

              // 配置 html-to-image 选项
              const options = {
                quality: exportOptions.format === 'jpeg' ? (exportOptions.quality || 0.9) : 1.0,
                pixelRatio: 2,
                backgroundColor: null, // 让容器自己处理背景
                width: exportContainer.offsetWidth,
                height: exportContainer.offsetHeight,
                style: {
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                  position: 'relative'
                },
                useCORS: true,
                allowTaint: true,
                skipFonts: false,
                cacheBust: true,
                // 包含所有CSS样式
                includeQueryParams: true
              };

              let dataUrl;
              const repoName = document.querySelector('.repo-name').textContent.replace('/', '-');

              try {
                // 检查 html-to-image 库是否加载
                if (typeof htmlToImage === 'undefined') {
                  throw new Error('html-to-image 库未加载');
                }

                // 更新 loading 消息
                updateGlobalLoadingMessage(\`生成 \${exportOptions.format.toUpperCase()} 图片...\`);

                // 根据格式选择导出方法，使用导出容器
                if (exportOptions.format === 'png') {
                  dataUrl = await htmlToImage.toPng(exportContainer, options);
                } else if (exportOptions.format === 'jpeg') {
                  dataUrl = await htmlToImage.toJpeg(exportContainer, options);
                } else if (exportOptions.format === 'svg') {
                  dataUrl = await htmlToImage.toSvg(exportContainer, options);
                }

                // 更新 loading 消息
                updateGlobalLoadingMessage('准备下载...');

                // 下载图片
                const link = document.createElement('a');
                link.download = \`github-card-\${repoName}.\${exportOptions.format}\`;
                link.href = dataUrl;
                link.click();

                // 隐藏全局 loading
                hideGlobalLoading();

                showNotification(\`\${exportOptions.format.toUpperCase()} 格式导出成功！\`, 'success');

              } finally {
                // 清理导出容器
                if (exportContainer && exportContainer.parentNode) {
                  exportContainer.parentNode.removeChild(exportContainer);
                }
              }

            } catch (error) {
              console.error('html-to-image 导出失败:', error);

              // 隐藏全局 loading
              hideGlobalLoading();

              // 提供更详细的错误信息
              let errorMessage = '图片导出失败';
              if (error.message.includes('html-to-image 库未加载')) {
                errorMessage = '图片库加载失败，请刷新页面重试';
              } else if (error.message.includes('backdrop-filter')) {
                errorMessage = '浏览器不支持某些视觉效果';
              } else {
                errorMessage = '图片导出失败：' + error.message;
              }

              showNotification(errorMessage, 'error');
            } finally {
              // 恢复按钮状态
              downloadBtn.innerHTML = originalText;
              downloadBtn.disabled = false;

              // 确保隐藏全局 loading（防止异常情况）
              hideGlobalLoading();
            }
          }
          
          // 显示导出选项对话框
          function showExportOptions() {
            return new Promise((resolve) => {
              const modal = document.createElement('div');
              modal.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                overflow-y: auto;
                padding: 20px;
              \`;

              modal.innerHTML = \`
                <div class="modal-content" style="
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  max-width: 900px;
                  width: 95%;
                  text-align: center;
                  max-height: 90vh;
                  overflow-y: auto;
                ">
                  <h3 style="margin-top: 0; color: #333;">🎨 选择导出选项</h3>
                  <p style="color: #666; margin-bottom: 25px;">选择图片格式和导出方式，右侧可实时预览效果</p>

                  <!-- 主要内容区域：左侧配置，右侧预览 -->
                  <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    align-items: start;
                    margin-bottom: 25px;
                  " id="main-content">

                    <!-- 左侧：配置选项 -->
                    <div style="text-align: left;">
                      <h4 style="margin-bottom: 15px; color: #333; text-align: center;">⚙️ 配置选项</h4>

                      <!-- 图片格式选择 -->
                      <div style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 10px; color: #333; font-weight: 600;">📷 图片格式</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                          <button class="format-option" data-format="png" style="
                            padding: 10px 6px;
                            border: 2px solid #667eea;
                            border-radius: 8px;
                            background: #f8f9ff;
                            cursor: pointer;
                            font-size: 11px;
                            transition: all 0.2s;
                          ">
                            <strong>PNG</strong><br>
                            <small style="color: #666;">无损压缩</small>
                          </button>
                          <button class="format-option" data-format="jpeg" style="
                            padding: 10px 6px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            font-size: 11px;
                            transition: all 0.2s;
                          ">
                            <strong>JPEG</strong><br>
                            <small style="color: #666;">小文件</small>
                          </button>
                          <button class="format-option" data-format="svg" style="
                            padding: 10px 6px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            font-size: 11px;
                            transition: all 0.2s;
                          ">
                            <strong>SVG</strong><br>
                            <small style="color: #666;">矢量图</small>
                          </button>
                        </div>
                      </div>

                      <!-- JPEG 质量设置 -->
                      <div id="jpeg-quality" style="margin-bottom: 20px; display: none;">
                        <label style="display: block; margin-bottom: 5px; color: #333;">JPEG 质量：</label>
                        <input type="range" id="quality-slider" min="0.1" max="1" step="0.1" value="0.9" style="width: 100%;">
                        <small style="color: #666;"><span id="quality-value">90</span>%</small>
                      </div>

                      <!-- 背景和边距设置 -->
                      <div style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 10px; color: #333; font-weight: 600;">🎨 背景设置</label>

                        <!-- 背景选择 -->
                        <div style="margin-bottom: 15px;">
                          <!-- 渐变背景选项 -->
                          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                            <button class="bg-option" data-bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" style="
                              padding: 6px;
                              border: 2px solid #e0e0e0;
                              border-radius: 6px;
                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              color: white;
                              cursor: pointer;
                              font-size: 9px;
                              text-align: center;
                            ">紫蓝</button>
                            <button class="bg-option" data-bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" style="
                              padding: 6px;
                              border: 2px solid #e0e0e0;
                              border-radius: 6px;
                              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                              color: white;
                              cursor: pointer;
                              font-size: 9px;
                              text-align: center;
                            ">粉红</button>
                            <button class="bg-option" data-bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" style="
                              padding: 6px;
                              border: 2px solid #e0e0e0;
                              border-radius: 6px;
                              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                              color: white;
                              cursor: pointer;
                              font-size: 9px;
                              text-align: center;
                            ">蓝青</button>
                          </div>

                          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 6px;">
                            <button class="bg-option" data-bg="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" style="
                              padding: 6px;
                              border: 2px solid #e0e0e0;
                              border-radius: 6px;
                              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                              color: white;
                              cursor: pointer;
                              font-size: 9px;
                              text-align: center;
                            ">橙粉</button>
                            <button class="bg-option" data-bg="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" style="
                              padding: 6px;
                              border: 2px solid #e0e0e0;
                              border-radius: 6px;
                              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                              color: #333;
                              cursor: pointer;
                              font-size: 9px;
                              text-align: center;
                            ">薄荷</button>
                            <button class="bg-option" data-bg="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" style="
                              padding: 6px;
                              border: 2px solid #e0e0e0;
                              border-radius: 6px;
                              background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                              color: #333;
                              cursor: pointer;
                              font-size: 9px;
                              text-align: center;
                            ">暖橙</button>
                          </div>
                        </div>

                        <!-- 内边距设置 -->
                        <div style="margin-bottom: 15px;">
                          <label style="display: block; margin-bottom: 5px; color: #333;">内边距：</label>
                          <input type="range" id="padding-slider" min="0" max="100" value="40" style="width: 100%;">
                          <small style="color: #666;"><span id="padding-value">40</span>px</small>
                        </div>
                      </div>
                    </div>

                    <!-- 右侧：实时预览 -->
                    <div style="text-align: center;">
                      <h4 style="margin-bottom: 15px; color: #333;">👀 实时预览</h4>
                      <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 350px;
                        padding: 20px;
                      ">
                        <div id="preview-container" style="
                          border: 2px dashed #e0e0e0;
                          border-radius: 12px;
                          background: #f9f9f9;
                          position: relative;
                          overflow: hidden;
                          transition: all 0.3s ease;
                        ">
                          <div id="preview-card">
                            <!-- 预览卡片将在这里动态生成 -->
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 响应式处理 -->
                  <style>
                    @media (max-width: 768px) {
                      #main-content {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                      }
                      .modal-content {
                        max-width: 95% !important;
                        padding: 20px !important;
                      }
                    }
                    @media (max-width: 480px) {
                      .modal-content {
                        padding: 15px !important;
                      }
                      #main-content {
                        gap: 15px !important;
                      }
                    }
                  </style>

                  <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-export" style="
                      padding: 12px 24px;
                      border: 1px solid #ccc;
                      border-radius: 6px;
                      background: white;
                      cursor: pointer;
                    ">取消</button>
                    <button id="confirm-export" style="
                      padding: 12px 24px;
                      border: none;
                      border-radius: 6px;
                      background: #667eea;
                      color: white;
                      cursor: pointer;
                      font-weight: 600;
                    ">导出图片</button>
                  </div>
                </div>
              \`;
              
              document.body.appendChild(modal);

              // 状态管理
              let selectedFormat = 'png';
              let selectedBackground = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

              // 格式选择事件监听
              const formatOptions = modal.querySelectorAll('.format-option');
              const qualitySection = modal.querySelector('#jpeg-quality');
              const qualitySlider = modal.querySelector('#quality-slider');
              const qualityValue = modal.querySelector('#quality-value');

              // 背景选择事件监听
              const bgOptions = modal.querySelectorAll('.bg-option');
              const paddingSlider = modal.querySelector('#padding-slider');
              const paddingValue = modal.querySelector('#padding-value');

              // 预览相关元素
              const previewContainer = modal.querySelector('#preview-container');
              const previewCard = modal.querySelector('#preview-card');

              // 创建预览卡片函数
              function createPreviewCard() {
                const originalCard = document.getElementById('github-card');
                if (!originalCard) return;

                // 获取原始卡片的尺寸
                const cardRect = originalCard.getBoundingClientRect();
                const originalWidth = cardRect.width;
                const originalHeight = cardRect.height;

                // 克隆原始卡片的HTML结构
                const cardHTML = originalCard.outerHTML;
                previewCard.innerHTML = cardHTML;

                // 获取预览卡片元素并设置ID以避免冲突
                const clonedCard = previewCard.querySelector('#github-card');
                if (clonedCard) {
                  clonedCard.id = 'preview-github-card';
                  // 移除点击事件
                  clonedCard.removeAttribute('onclick');
                  clonedCard.style.cursor = 'default';

                  // 保持原始卡片的尺寸比例
                  clonedCard.style.width = originalWidth + 'px';
                  clonedCard.style.height = originalHeight + 'px';
                }

                // 存储原始尺寸供后续使用
                previewCard.dataset.originalWidth = originalWidth;
                previewCard.dataset.originalHeight = originalHeight;
              }

              // 更新预览函数
              function updatePreview() {
                const padding = parseInt(paddingSlider.value);
                const originalWidth = parseFloat(previewCard.dataset.originalWidth || '550');
                const originalHeight = parseFloat(previewCard.dataset.originalHeight || '300');

                // 计算包含内边距的总尺寸（模拟最终导出图片的尺寸）
                const totalWidth = originalWidth + (padding * 2);
                const totalHeight = originalHeight + (padding * 2);

                // 计算预览容器的最大可用空间（响应式）
                const isMobile = window.innerWidth <= 768;
                const maxPreviewWidth = isMobile ? 280 : 350; // 预览区域最大宽度
                const maxPreviewHeight = isMobile ? 300 : 400; // 预览区域最大高度

                // 计算缩放比例，保持宽高比
                const scaleX = maxPreviewWidth / totalWidth;
                const scaleY = maxPreviewHeight / totalHeight;
                const scale = Math.min(scaleX, scaleY, 0.8); // 最大缩放到80%

                // 应用缩放和尺寸
                const scaledWidth = totalWidth * scale;
                const scaledHeight = totalHeight * scale;
                const scaledPadding = padding * scale;

                // 更新预览容器尺寸和样式
                previewContainer.style.width = scaledWidth + 'px';
                previewContainer.style.height = scaledHeight + 'px';
                previewContainer.style.padding = scaledPadding + 'px';
                previewContainer.style.boxSizing = 'border-box';

                // 更新预览容器背景
                previewContainer.style.background = selectedBackground;
                previewContainer.style.backgroundSize = 'cover';
                previewContainer.style.backgroundPosition = 'center';

                // 更新预览卡片的缩放
                const clonedCard = previewCard.querySelector('#preview-github-card');
                if (clonedCard) {
                  clonedCard.style.transform = \`scale(\${scale})\`;
                  clonedCard.style.transformOrigin = 'top left';
                  clonedCard.style.position = 'relative';
                }

                // 重置预览卡片容器的transform
                previewCard.style.transform = 'none';
                previewCard.style.width = 'auto';
                previewCard.style.height = 'auto';

                // 添加格式标识
                const formatIndicator = modal.querySelector('#format-indicator');
                if (formatIndicator) {
                  formatIndicator.textContent = selectedFormat.toUpperCase();
                } else {
                  const indicator = document.createElement('div');
                  indicator.id = 'format-indicator';
                  indicator.style.cssText = \`
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    z-index: 10;
                  \`;
                  indicator.textContent = selectedFormat.toUpperCase();
                  previewContainer.appendChild(indicator);
                }

                // 添加尺寸信息显示
                const sizeInfo = modal.querySelector('#size-info');
                if (sizeInfo) {
                  sizeInfo.textContent = \`\${Math.round(totalWidth)} × \${Math.round(totalHeight)}px\`;
                } else {
                  const info = document.createElement('div');
                  info.id = 'size-info';
                  info.style.cssText = \`
                    position: absolute;
                    bottom: 5px;
                    left: 5px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    z-index: 10;
                  \`;
                  info.textContent = \`\${Math.round(totalWidth)} × \${Math.round(totalHeight)}px\`;
                  previewContainer.appendChild(info);
                }
              }

              // 初始化预览
              createPreviewCard();
              updatePreview();

              formatOptions.forEach(btn => {
                btn.onclick = () => {
                  // 重置所有按钮样式
                  formatOptions.forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                    b.style.backgroundColor = 'white';
                  });

                  // 设置选中样式
                  btn.style.borderColor = '#667eea';
                  btn.style.backgroundColor = '#f8f9ff';

                  selectedFormat = btn.dataset.format;

                  // 显示/隐藏 JPEG 质量设置
                  if (selectedFormat === 'jpeg') {
                    qualitySection.style.display = 'block';
                  } else {
                    qualitySection.style.display = 'none';
                  }

                  // 更新预览
                  updatePreview();
                };
              });

              // 背景选择事件
              bgOptions.forEach(btn => {
                btn.onclick = () => {
                  // 重置所有背景按钮样式
                  bgOptions.forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                  });

                  // 设置选中样式
                  btn.style.borderColor = '#667eea';
                  selectedBackground = btn.dataset.bg;

                  // 更新预览
                  updatePreview();
                };
              });

              // 内边距滑块
              paddingSlider.oninput = () => {
                paddingValue.textContent = paddingSlider.value;
                // 更新预览
                updatePreview();
              };

              // JPEG 质量滑块
              qualitySlider.oninput = () => {
                qualityValue.textContent = Math.round(qualitySlider.value * 100);
                // 质量改变不需要更新预览，因为预览不显示压缩效果
              };

              // 确认导出按钮
              modal.querySelector('#confirm-export').onclick = () => {
                document.body.removeChild(modal);
                resolve({
                  format: selectedFormat,
                  quality: selectedFormat === 'jpeg' ? parseFloat(qualitySlider.value) : 1.0,
                  backgroundColor: selectedBackground,
                  padding: parseInt(paddingSlider.value)
                });
              };

              // 取消按钮
              modal.querySelector('#cancel-export').onclick = () => {
                document.body.removeChild(modal);
                resolve(null);
              };

              // 点击背景关闭
              modal.onclick = (e) => {
                if (e.target === modal) {
                  document.body.removeChild(modal);
                  resolve(null);
                }
              };
            });
          }
          
          // 简单裁切函数
          function simpleCrop(sourceCanvas, cardRect, video, padding = 20) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 获取更准确的视窗尺寸，避免开发者工具影响
            const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
            const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
            
            // 最简单的比例计算
            const scaleX = sourceCanvas.width / viewportWidth;
            const scaleY = sourceCanvas.height / viewportHeight;
            
            const cropArea = {
              x: Math.max(0, cardRect.left * scaleX - padding),
              y: Math.max(0, cardRect.top * scaleY - padding),
              width: Math.min(sourceCanvas.width - cardRect.left * scaleX + padding, cardRect.width * scaleX + padding * 2),
              height: Math.min(sourceCanvas.height - cardRect.top * scaleY + padding, cardRect.height * scaleY + padding * 2)
            };
            
            canvas.width = cropArea.width;
            canvas.height = cropArea.height;
            
            ctx.drawImage(
              sourceCanvas,
              cropArea.x, cropArea.y, cropArea.width, cropArea.height,
              0, 0, cropArea.width, cropArea.height
            );
            
            return canvas;
          }
          

          
          // 打开GitHub仓库
          function openRepository(fullName) {
            if (!fullName) {
              console.error('仓库名称不能为空');
              return;
            }
            const url = 'https://github.com/' + fullName;
            console.log('正在打开:', url); // 调试信息
            window.open(url, '_blank', 'noopener,noreferrer');
          }
          
          // 主导出函数 - 优先使用 html-to-image
          async function downloadCard() {
            try {
              // 优先使用 html-to-image 方案
              await downloadCardByHtmlToImage();
            } catch (error) {
              console.error('html-to-image 导出失败:', error);

              // 确保隐藏全局 loading
              hideGlobalLoading();

              // 显示错误信息
              showNotification('图片导出失败，请尝试刷新页面后重试', 'error');
            }
          }
          
          function shareCard() {
            const url = window.location.href;
            if (navigator.share) {
              navigator.share({
                title: 'GitHub 项目卡片',
                text: '查看这个 GitHub 项目的精美卡片',
                url: url
              });
            } else {
              navigator.clipboard.writeText(url).then(() => {
                showNotification('链接已复制到剪贴板！', 'success');
              }).catch(() => {
                showNotification('复制失败，请手动复制链接', 'error');
              });
            }
          }
          
          function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`notification notification-\${type} show\`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
              notification.classList.remove('show');
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              }, 300);
            }, 3000);
          }
        `
      }} />
    </div>
  )
})

export default app
