# AT命令工具 (WebATCmdTools)

基于 Vue 3 的网页版 AT 命令产测工具。通过浏览器的 Web Serial API 直接与设备串口通信，无需安装桌面软件，即可对多种芯片平台的设备进行写号、频段锁定等产测与调试操作。

## 功能

通用能力：

- 串口设备选择与连接管理，波特率固定为 9600（8 数据位、1 停止位、无校验）
- 连接成功后自动查询设备信息（IMEI、MAC、频段等）
- 自定义 AT 命令发送与实时日志显示（后台持续读取、自动滚动、可清空）
- PWA 支持，可安装为独立应用并离线使用

各芯片平台功能：

| 平台              | 页面    | 功能                                                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| 中兴微 (ZXIC)     | `/zxic` | IMEI 读写、无线/有线 MAC 读写、LTE 频段读取与锁定、小区锁定、工厂模式、ADB 调试开关与设备重启、限速检测 |
| ASR (翱捷科技)    | `/asr`  | 工厂模式控制、IMEI/SN/WiFi MAC 读写与删除、双卡切换、LTE 频段锁定                                       |
| 展锐 (Spreadtrum) | `/sprd` | 双 IMEI 读写、LTE 频段锁定、设备重启                                                                    |

## 系统要求与使用

1. 浏览器：支持 Web Serial API 的电脑版 Chromium 内核浏览器（Chrome、Edge 等），其他浏览器无法连接设备
2. 先在电脑上安装设备的串口驱动
3. 打开工具进入对应平台页面，点击「选择端口」，在弹出的列表中选择设备的 AT 端口
4. 连接成功后自动查询设备信息，随后即可执行读取与写入操作

注意事项：

- 连接期间串口数据由后台循环持续读取；如果界面数据与预期不符，重新点击对应数据的「读取」按钮刷新
- 通过 `window.open` 打开设备 Web 管理页的 ADB/重启操作，需要电脑与设备管理端同网段可达

## 开发

环境要求：Node.js 与 pnpm（版本由 `package.json` 的 `packageManager` 字段锁定，可用 `corepack enable` 启用）。

常用命令：

```bash
pnpm install        # 安装依赖
pnpm dev            # 启动开发服务器（http://localhost:3000，自动打开浏览器，支持局域网访问）
pnpm lint:check     # ESLint 检查
pnpm lint           # ESLint 检查并自动修复
pnpm format         # Prettier 格式化
pnpm format:check   # Prettier 检查
pnpm build          # 构建生产版本到 dist/
pnpm preview        # 本地预览生产构建
```

### 字体子集维护

页面中文标题使用的思源宋体按项目实际用字子集化为单个 woff2 文件，由 `scripts/fetch_noto_serif_sc.py` 生成。新增或修改页面中文文案后需要重新生成，否则衬线标题会出现回退字形：

```bash
python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
python3 scripts/fetch_noto_serif_sc.py
```

其余拉丁字体（Source Serif 4、Archivo、IBM Plex Mono）为固定的子集文件，无需维护。

## 目录结构

```
src/
├── views/                  # 页面
│   ├── index.vue           # 首页，平台入口选择
│   ├── zxic.vue            # 中兴微平台功能页
│   ├── asr.vue             # ASR 平台功能页
│   └── sprd.vue            # 展锐平台功能页
├── components/
│   ├── DeviceBar.vue       # 吸顶设备状态栏（返回入口/平台标识/连接指示灯/断开连接）
│   ├── SectionPanel.vue    # 功能分区面板（等宽眉标/标题/核心 AT 命令标注）
│   ├── ConnectPrompt.vue   # 设备未连接时的引导与连接入口
│   ├── BandSelector.vue    # LTE 频段选择器
│   └── SerialConsole.vue   # 串口控制台（命令输入 + 日志显示）
├── utils/
│   ├── serial.js           # SerialPortManager 串口管理（连接/发送/后台读取循环）
│   ├── serialPortMixin.js  # 页面串口生命周期混入工厂（状态轮询/日志/按行解析）
│   ├── band.js             # LTE 频段位图编解码（各平台频段读写共用）
│   └── writeGuard.js       # 写号前的格式校验与二次确认
├── router/index.js         # 路由配置（hash 模式，404 重定向首页）
├── assets/fonts/           # 自托管字体与思源宋体子集声明
├── style.css               # Tailwind 入口，Claude 主题设计令牌与组件类
└── main.js                 # 应用入口
scripts/
└── fetch_noto_serif_sc.py  # 思源宋体子集生成脚本
public/
└── favicon.svg             # 应用图标
```

## 技术栈与构建

- **框架**：Vue 3 + Vue Router 5（hash 模式路由）
- **构建**：Vite 8（Rolldown），es2015 目标，terser 移除 console/debugger，vue-vendor 与 utils 手动分块
- **样式**：Tailwind CSS 4（CSS-first 配置），主题令牌集中在 `style.css` 的 `@theme`
- **字体**：全部自托管——Source Serif 4（衬线标题）、Archivo（界面文本）、IBM Plex Mono（命令与数据）、思源宋体（中文标题子集）
- **PWA**：vite-plugin-pwa，autoUpdate 模式，预缓存 js/css/html/图标/字体
- **代码质量**：ESLint 10（flat config）+ Prettier

构建使用相对路径 `base: './'`，产物可部署在任意静态目录下。

## 部署

推送到 `main` 分支（或手动触发 `Deploy site to GitHub Pages` workflow）后，GitHub Actions 执行依赖安装、`lint:check` 代码检查与构建，再通过官方 Pages 流程把 `dist/` 发布到 GitHub Pages：

- 工作流文件：`.github/workflows/site-pages.yml`，仅当 `src/`、`public/`、构建配置等会影响产物的文件变化时触发
- 站点地址：`https://<owner>.github.io/WebATCmdTools/`，部署 URL 也会显示在 workflow 运行页与仓库的 Deployments 中

首次启用需要在仓库 `Settings → Pages` 把 Source 设为 **GitHub Actions**，此后无需任何密钥，也不需要维护 `gh-pages` 分支。未启用时 workflow 会在 `Configure GitHub Pages` 步骤直接失败（`Get Pages site failed`），命令行启用方式：

```bash
gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
```

## 常见问题

1. **浏览器提示不支持串口**
   - 使用电脑版 Chrome、Edge 等 Chromium 内核浏览器；Firefox、Safari 及移动端浏览器不支持 Web Serial API
   - 页面需通过 HTTPS 或 localhost 访问（Web Serial API 的安全要求），GitHub Pages 部署已满足
2. **找不到串口设备**
   - 检查 USB 连接与驱动安装，在系统设备管理器中确认串口设备已被识别
   - 弹出的列表中可能包含设备的多个串口，需选择 AT 端口
3. **数据显示异常**
   - 重新点击对应数据的「读取」按钮刷新
   - 检查串口线连接是否稳定

## 提交规范

提交信息遵循 Conventional Commits 规范：type/scope 使用英文，主题与正文使用中文，正文以 `- ` 逐条说明变更内容与原因。

## 许可证

本项目基于 [MIT License](./LICENSE) 发布，版权信息见 LICENSE 文件中的贡献者名单。
