# QHelper Chrome 扩展上架剩余步骤

## 当前进度

### ✅ 已完成
- [x] package.json 更新 author 字段
- [x] 创建商店列表描述 (STORE_LISTING.md)
- [x] 创建隐私政策 (PRIVACY.md + docs/privacy.html)
- [x] 更新项目说明 (README.md)

---

## 第一步：启用 GitHub Pages（隐私政策托管）

### 1.1 在 GitHub 上启用 Pages

1. 打开 GitHub 仓库页面: https://github.com/sunven/QHelper
2. 点击 **Settings** (设置) 标签页
3. 在左侧菜单找到 **Pages** (在 "Code and automation" 部分)
4. 配置以下选项:
   - **Source**: Deploy from a branch
   - **Branch**: `master` (或 `main`) + `/docs` 目录
5. 点击 **Save**

### 1.2 验证隐私政策页面

等待约 1-2 分钟后访问:
```
https://sunven.github.io/QHelper/privacy.html
```

确保页面能正常显示。

---

## 第二步：准备扩展截图

### 2.1 启动开发环境

```bash
cd /Users/sunven/github/QHelper
pnpm dev
```

### 2.2 加载扩展到浏览器

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 打开右上角"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `.output/chrome-mv3` 目录

### 2.3 截取工具页面截图

**要求尺寸**: 1280x800px 或 640x400px

需要截取以下页面:

| # | 页面 | 操作步骤 |
|---|------|----------|
| 1 | 主弹出窗口 | 点击扩展图标，截取工具列表 |
| 2 | JSON 格式化 | 打开 JSON 工具，输入一段 JSON，展示格式化效果 |
| 3 | 时间戳转换 | 打开时间戳工具，展示转换功能 |
| 4 | 编码转换 | 打开编码工具，展示 Base64/URL 编码转换 |
| 5 | 图片拼接 | 打开图片拼接工具，展示功能界面 |

### 2.4 截图工具建议

- **macOS**: 使用自带截图工具，按 `Cmd + Shift + 4` 选择区域
- **调整尺寸**: 可以使用在线工具或图片编辑软件调整到指定尺寸
- **在线工具**: https://www.iloveimg.com/resize-image

---

## 第三步：最终构建和测试

### 3.1 生产构建

```bash
cd /Users/sunven/github/QHelper
pnpm build
```

### 3.2 测试构建结果

1. 访问 `chrome://extensions/`
2. 移除之前的开发版本
3. 重新加载 `.output/chrome-mv3` 目录
4. 测试各个工具是否正常工作

---

## 第四步：提交到 Chrome Web Store

### 4.1 注册开发者账号

1. 访问 Chrome Web Store Developer Dashboard:
   ```
   https://chrome.google.com/webstore/devconsole
   ```

2. 使用 Google 账号登录

3. 支付一次性注册费 **$5 USD**

4. 完成开发者账号验证

### 4.2 创建新项目

1. 点击 **"New Item"** 按钮

2. 上传 ZIP 文件:
   ```bash
   # 在 .output 目录创建 ZIP
   cd /Users/sunven/github/QHelper/.output
   zip -r QHelper.zip chrome-mv3/
   ```

3. 选择并上传 `QHelper.zip`

### 4.3 填写商店信息

#### 基本信息页

| 字段 | 内容 |
|------|------|
| **Name** | QHelper前端助手 |
| **Short description (最多 132 字符)** | 前端开发必备工具箱：JSON格式化、时间戳转换、编码转换、Base64图片、进制转换、代码美化/压缩等10+实用工具 |
| **Long description** | 使用 `STORE_LISTING.md` 中的详细描述 |
| **Category** | Developer Tools |
| **Language** | 中文 (简体) |

#### 商店图片页

| 项目 | 要求 | 文件 |
|------|------|------|
| **图标** | 128x128px | 已有 `/public/icons/q-128.png` |
| **小图标 (可选)** | 16x16px | 已有 `/public/icons/q-16.png` |
| **截图** | 1280x800px 或 640x400px | 你需要准备 1-5 张 |
| **宣传图 (可选)** | 440x280px | 可选，暂不需要 |

#### 隐私与实践页

| 字段 | 内容 |
|------|------|
| **Privacy policy URL** | `https://sunven.github.io/QHelper/privacy.html` |
| **但不用时说明权限** | 选择此项，为每个权限添加说明 |

权限说明（参考）:

```
cookies: 用于"清除 Cookie"功能，数据不离开浏览器
tabs: 用于在新标签页打开工具界面，不读取标签页内容
storage: 用于存储用户偏好设置，仅本地存储
host_permissions: 仅在 GitHub 页面注入"在 vscode.dev 中打开"按钮
```

#### 定价与分发页

- **Distribution**: Public (公开)
- **Countries**: All countries (所有国家)
- **Listing visibility**: Visible (公开可见)

### 4.4 提交审核

1. 检查所有必填项是否完成
2. 点击 **"Submit for review"**
3. 等待审核结果（通常 3-7 个工作日）

---

## 附录：商店列表描述（复制粘贴用）

### 简短描述

```
前端开发必备工具箱：JSON格式化、时间戳转换、编码转换、Base64图片、进制转换、代码美化/压缩等10+实用工具
```

### 详细描述

```
QHelper 前端助手是一款专为前端开发者设计的 Chrome/Chromium 浏览器扩展，提供 10+ 常用开发工具，让您的工作更高效。

## 功能列表

### 常用工具
- JSON 格式化/解析：支持语法高亮、错误检测、格式对比
- 进制转换：快速在 2/8/10/16 进制之间转换
- 时间戳转换：Unix 时间戳与日期时间互转

### 编码工具
- 字符串编码转换：Base64、URL 编码、HTML 实体编码
- 代码美化：格式化压缩的 JavaScript/HTML/CSS 代码
- 代码压缩：UglifyJS 压缩 JavaScript 代码

### 图片工具
- 图片转 Base64：快速将图片转换为 Base64 编码
- 图片拼接：多张图片水平/垂直拼接

### 其他工具
- 颜色转换：RGB、HEX、HSL 颜色格式互转
- 清除 Cookie：一键清除当前站点所有 Cookie

## 特色功能

- GitHub 集成：在 GitHub 仓库页面添加 "在 vscode.dev 中打开" 按钮
- 本地存储：所有数据仅存储在浏览器本地，不上传云端
- 隐私保护：不收集任何用户数据
- 离线可用：所有工具完全离线运行

## 适用人群

- 前端开发工程师
- 全栈开发工程师
- 测试工程师
- 需要频繁处理数据的开发者

## 使用方式

1. 点击浏览器工具栏中的 QHelper 图标
2. 选择需要的工具
3. 工具将在新标签页中打开，方便使用
```

---

## 常见问题

### Q: 审核被拒怎么办？
A: 常见原因包括：描述与功能不符、缺少隐私政策、权限申请过多。确保隐私政策 URL 可访问，描述准确反映扩展功能。

### Q: 需要多长时间审核？
A: 通常 3-7 个工作日。节假日可能延长。

### Q: 如何更新扩展？
A: 在 Developer Dashboard 选择你的扩展，上传新版本 ZIP，填写更新说明，重新提交审核。

### Q: 可以查看审核状态吗？
A: 可以在 Developer Dashboard 的"发布状态"中查看当前审核进度。

---

## 关键文件速查

```
/Users/sunven/github/QHelper/STORE_LISTING.md   # 商店列表描述
/Users/sunven/github/QHelper/PRIVACY.md         # 隐私政策源文件
/Users/sunven/github/QHelper/docs/privacy.html  # 隐私政策 HTML
/Users/sunven/github/QHelper/.output/           # 构建输出，上传用
```

---

## 完成清单

上架前确认:

- [ ] GitHub Pages 已启用，隐私政策可访问
- [ ] 已准备至少 1 张截图（推荐 3-5 张）
- [ ] 运行 `pnpm build` 构建成功
- [ ] 测试 `.output/chrome-mv3` 扩展可用
- [ ] 已注册 Chrome Web Store 开发者账号
- [ ] 准备好 ZIP 上传文件
- [ ] 准备好商店列表描述
- [ ] 准备好隐私政策 URL

---

**祝上架顺利！** 🚀
