# AT命令工具 (WebATCmdTools)

基于 Vue 3 与 Vite 构建的网页版 AT 命令工具。通过浏览器的 Web Serial API 直接与设备串口通信，无需安装桌面软件，即可对多种芯片平台的设备进行产测与调试。

## 功能特性

通用能力：

- 基于 Web Serial API 的串口设备选择与连接管理
- 自定义 AT 命令发送与实时日志显示（后台持续读取，自动滚动）
- 统一的串口生命周期管理与错误提示
- PWA 支持，可安装为独立应用

各芯片平台功能：

| 平台              | 页面    | 功能                                                                                |
| ----------------- | ------- | ----------------------------------------------------------------------------------- |
| 中兴微 (ZTE)      | `/zc`   | IMEI 读写、无线/有线 MAC 读写、LTE 频段读取与锁定、小区锁定、ADB 调试开关、设备重启 |
| ASR (翱捷科技)    | `/asr`  | IMEI/SN/WiFi MAC 读写、双卡切换、LTE 频段锁定、工厂模式控制                         |
| 展锐 (Spreadtrum) | `/sprd` | 双 IMEI 读写、LTE 频段锁定、设备重启                                                |

## 系统要求

- **浏览器**：支持 Web Serial API 的 Chromium 内核浏览器（Chrome、Edge 等）
- **操作系统**：Windows、macOS、Linux
- **设备**：通过 USB 转串口连接到电脑的 AT 命令设备

## 使用说明

1. 使用 USB 线连接设备，安装对应的 USB 转串口驱动
2. 在 Chromium 内核浏览器中打开本工具，进入对应平台页面
3. 点击「选择端口」，在浏览器弹出的串口列表中选择 AT 端口
4. 连接成功后页面自动查询设备信息，随后即可执行相应操作

注意事项：

- 串口波特率固定为 9600（8 数据位、1 停止位、无校验）
- 连接期间串口数据由后台循环持续读取，如界面数据与预期不符，可重新点击读取按钮刷新
- 通过 `window.open` 打开设备 Web 管理页的 ADB/重启操作依赖设备与管理端同网段可达

## 项目结构

```
src/
├── views/                  # 页面
│   ├── index.vue           # 首页，平台入口选择
│   ├── zc.vue              # 中兴微平台功能页
│   ├── asr.vue             # ASR 平台功能页
│   └── sprd.vue            # 展锐平台功能页
├── components/
│   ├── BandSelector.vue    # LTE 频段选择器
│   └── SerialConsole.vue   # 串口控制台（命令输入 + 日志显示）
├── utils/
│   ├── serial.js           # SerialPortManager 串口管理（连接/发送/后台读取循环）
│   └── serialPortMixin.js  # 页面串口生命周期混入工厂
├── router/index.js         # 路由配置（hash 模式，404 重定向首页）
├── style.css               # Tailwind 入口与 Claude 配色主题
└── main.js                 # 应用入口
```

## 技术栈

- **框架**：Vue 3 + Vue Router 5
- **构建工具**：Vite 8（Rolldown）
- **样式**：Tailwind CSS 4（CSS-first 配置，Claude 配色主题）
- **包管理**：pnpm
- **核心 API**：Web Serial API
- **代码质量**：ESLint 10（flat config）+ Prettier
- **部署**：GitHub Actions + GitHub Pages

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认 3000 端口）
pnpm dev

# 代码检查
pnpm lint:check

# 格式化
pnpm format

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

提交信息遵循 Conventional Commits 规范：type/scope 使用英文，主题与正文使用中文，正文以 `- ` 逐条说明变更内容与原因。

## 部署

推送到 `main` 分支后，GitHub Actions 自动执行依赖安装、代码检查与构建，并发布到 GitHub Pages，同时同步至 `smanx/app` 仓库的 `atmaster` 目录。构建产物包含 PWA service worker，支持离线缓存。

## 常见问题

1. **浏览器不支持串口功能**
   - 使用 Chrome、Edge 等基于 Chromium 内核的浏览器，并确认版本支持 Web Serial API
2. **找不到串口设备**
   - 检查 USB 连接与驱动安装，在系统设备管理器中确认串口设备已被识别
3. **数据显示异常**
   - 重新点击对应读取按钮刷新数据
   - 检查串口线连接是否稳定

## 许可证

本项目基于 [MIT License](./LICENSE) 发布，版权信息见 LICENSE 文件中的贡献者名单。
