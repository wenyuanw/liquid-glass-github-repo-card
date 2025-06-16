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
          <div id="github-card" class="github-card liquidGlass-wrapper">
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

          <div class="card-actions">
            <button onclick="downloadCard()" class="action-btn download-btn">
              <span class="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </span>
              下载卡片
            </button>
            <button onclick="shareCard()" class="action-btn share-btn">
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

      <script dangerouslySetInnerHTML={{
        __html: `
          // 方案1：使用 Screen Capture API 截图导出（保留完整效果 + 智能裁切）
          async function downloadCardByScreenshot() {
            const card = document.getElementById('github-card');
            const downloadBtn = document.querySelector('.download-btn');
            
            // 显示加载状态
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<span class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></span>准备截图...';
            downloadBtn.disabled = true;
            
            // 提供多种导出选项
            const exportOptions = await showExportOptions();
            if (!exportOptions) {
              downloadBtn.innerHTML = originalText;
              downloadBtn.disabled = false;
              return;
            }
            
            try {
              // 检查浏览器是否支持 Screen Capture API
              if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('您的浏览器不支持屏幕截图功能，将使用备用方案');
              }
              
              // 滚动到卡片位置，确保完全可见
              card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              await new Promise(resolve => setTimeout(resolve, 500)); // 等待滚动完成
              
              // 获取卡片的精确位置和尺寸
              const cardRect = card.getBoundingClientRect();
              const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
              const scrollY = window.pageYOffset || document.documentElement.scrollTop;
              
              // 计算卡片在整个页面中的绝对位置
              const cardPosition = {
                x: cardRect.left + scrollX,
                y: cardRect.top + scrollY,
                width: cardRect.width,
                height: cardRect.height
              };
              
              // 添加临时的视觉标记（隐藏的，用于辅助定位）
              const marker = document.createElement('div');
              marker.id = 'screenshot-marker';
              marker.style.cssText = \`
                position: absolute;
                top: \${cardPosition.y}px;
                left: \${cardPosition.x}px;
                width: \${cardPosition.width}px;
                height: \${cardPosition.height}px;
                border: 2px solid transparent;
                z-index: 99999;
                pointer-events: none;
              \`;
              document.body.appendChild(marker);
              
              // 创建详细的指导说明
              const instructionModal = document.createElement('div');
              instructionModal.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 12px;
                z-index: 10000;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
              \`;
              instructionModal.innerHTML = \`
                <h3 style="margin-top: 0;">📸 截图指导</h3>
                <p>即将弹出截图选择窗口，请按以下步骤操作：</p>
                <div style="text-align: left; margin: 15px 0;">
                  <p>选择窗口-当前的浏览器窗口</p>
                </div>
                <button id="start-capture" style="
                  background: #667eea;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 6px;
                  cursor: pointer;
                  margin: 5px;
                ">开始截图</button>
                <button id="cancel-capture" style="
                  background: #666;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 6px;
                  cursor: pointer;
                  margin: 5px;
                ">取消</button>
              \`;
              document.body.appendChild(instructionModal);
              
              // 等待用户选择
              const userChoice = await new Promise((resolve) => {
                document.getElementById('start-capture').onclick = () => resolve(true);
                document.getElementById('cancel-capture').onclick = () => resolve(false);
              });
              
              document.body.removeChild(instructionModal);
              
              if (!userChoice) {
                throw new Error('用户取消了截图操作');
              }
              
              // 启动屏幕截图 - 优化参数以显示更多选项
              const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                  displaySurface: 'browser',  // 优先显示浏览器标签页选项
                  width: { ideal: 1920, max: 1920 },
                  height: { ideal: 1080, max: 1080 },
                  frameRate: { ideal: 30, max: 30 }
                },
                audio: false  // 不需要音频
              });
              
              // 创建视频元素
              const video = document.createElement('video');
              video.srcObject = stream;
              video.play();
              
              // 等待视频准备就绪
              await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
              });
              
              downloadBtn.innerHTML = '<span class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></span>处理中...';
              
              // 创建完整的截图 canvas
              const fullCanvas = document.createElement('canvas');
              const fullCtx = fullCanvas.getContext('2d');
              fullCanvas.width = video.videoWidth;
              fullCanvas.height = video.videoHeight;
              
              // 绘制完整的视频帧
              fullCtx.drawImage(video, 0, 0);
              
              // 停止录制
              stream.getTracks().forEach(track => track.stop());
              
              // 移除标记元素
              document.body.removeChild(marker);
              
              let finalCanvas;
              const repoName = document.querySelector('.repo-name').textContent.replace('/', '-');
              
                             if (exportOptions.mode === 'full') {
                 // 导出完整截图
                 finalCanvas = fullCanvas;
                 showNotification('完整截图导出成功！', 'success');
               } else {
                 // 普通裁切模式
                 finalCanvas = simpleCrop(fullCanvas, cardRect, video, exportOptions.padding);
                 showNotification('普通裁切导出成功！', 'success');
               }
              
              // 下载图片
              const link = document.createElement('a');
              link.download = \`github-card-\${repoName}-\${exportOptions.mode}.png\`;
              link.href = finalCanvas.toDataURL('image/png', 1.0);
              link.click();
              
            } catch (error) {
              console.error('截图导出失败:', error);
              if (error.message.includes('用户取消')) {
                showNotification('已取消截图导出', 'info');
              } else {
                showNotification('截图导出失败：' + error.message + '\\n\\n请确保允许网站访问屏幕截图权限', 'error');
              }
            } finally {
              // 恢复按钮状态
              downloadBtn.innerHTML = originalText;
              downloadBtn.disabled = false;
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
              \`;
              
              modal.innerHTML = \`
                <div style="
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  max-width: 500px;
                  width: 90%;
                  text-align: center;
                ">
                  <h3 style="margin-top: 0; color: #333;">🎨 选择导出方式</h3>
                  <p style="color: #666; margin-bottom: 20px;">选择最适合您的导出方式</p>
                  
                  <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                    <button class="export-option" data-mode="full" style="
                      padding: 15px;
                      border: 2px solid #e0e0e0;
                      border-radius: 8px;
                      background: white;
                      cursor: pointer;
                      text-align: left;
                      transition: all 0.2s;
                    ">
                      <strong>🖼️ 完整截图</strong><br>
                      <small style="color: #666;">保存整个截图，不进行裁切</small>
                    </button>
                    
                                         <button class="export-option" data-mode="simple" style="
                       padding: 15px;
                       border: 2px solid #e0e0e0;
                       border-radius: 8px;
                       background: white;
                       cursor: pointer;
                       text-align: left;
                       transition: all 0.2s;
                     ">
                       <strong>✂️ 普通裁切</strong><br>
                       <small style="color: #666;">自动裁切卡片区域</small>
                     </button>
                  </div>
                  
                  <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">边距大小：</label>
                    <input type="range" id="padding-slider" min="0" max="50" value="20" style="width: 100%;">
                    <small style="color: #666;"><span id="padding-value">20</span>px 边距</small>
                  </div>
                  
                  <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-export" style="
                      padding: 10px 20px;
                      border: 1px solid #ccc;
                      border-radius: 6px;
                      background: white;
                      cursor: pointer;
                    ">取消</button>
                  </div>
                </div>
              \`;
              
              document.body.appendChild(modal);
              
              // 添加事件监听
              const paddingSlider = modal.querySelector('#padding-slider');
              const paddingValue = modal.querySelector('#padding-value');
              paddingSlider.oninput = () => {
                paddingValue.textContent = paddingSlider.value;
              };
              
              // 选项按钮点击效果
              modal.querySelectorAll('.export-option').forEach(btn => {
                btn.onclick = () => {
                  document.body.removeChild(modal);
                  resolve({
                    mode: btn.dataset.mode,
                    padding: parseInt(paddingSlider.value)
                  });
                };
                
                btn.onmouseenter = () => {
                  btn.style.borderColor = '#667eea';
                  btn.style.backgroundColor = '#f8f9ff';
                };
                
                btn.onmouseleave = () => {
                  btn.style.borderColor = '#e0e0e0';
                  btn.style.backgroundColor = 'white';
                };
              });
              
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
          

          
          // 主导出函数 - 直接使用截图方式
          async function downloadCard() {
            // 检查是否支持 Screen Capture API
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
              await downloadCardByScreenshot();
            } else {
              // 浏览器不支持截图API，显示提示信息
              showNotification('抱歉，您的浏览器不支持屏幕截图功能，请使用最新版的 Chrome、Edge 或 Firefox 浏览器', 'error');
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
