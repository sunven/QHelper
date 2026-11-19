# QHelper

QHelper 是面向前端开发者的 Chrome 扩展工具集。本词汇表只收录需要精确区分的业务概念，随功能设计持续增补。

## Language

**站点（Site）**:
工具清理动作的目标作用域，等同浏览器的源：协议 + 主机 + 端口，例如 `https://app.example.com`。不同子域、不同协议视为不同站点。
_Avoid_: 域名、域、网站（都表达不了协议与端口的边界）

**站点数据（Site Data）**:
与某个站点关联、可被用户主动清除的客户端状态集合：Cookie、localStorage、sessionStorage、IndexedDB、Cache Storage 与 Service Worker 注册。
_Avoid_: 缓存（过窄，只指其中一类）、Storage（过宽，易与扩展自身存储混淆）

**当前站点（Current Site）**:
启动「清除站点数据」时所在标签页的站点。它是启动时的快照，不随之后切换标签页而变化。
_Avoid_: 活动标签页（那是浏览器概念，不是清理目标）

**全部站点模式（All-Sites Mode）**:
以整个浏览器为作用域的清理模式，影响所有站点，且无法按站点预览明细。
_Avoid_: 全局清理、一键清除（不足以说明影响范围）

**父域 Cookie（Domain Cookie）**:
通过 Domain 属性对子域共享的 Cookie，例如 `.example.com` 对 `app.example.com` 可见。与之相对的是仅属于设置它的主机的 Host-only Cookie。
_Avoid_: 跨域 Cookie

**受限页面（Restricted Page）**:
工具无法读取或清理其数据的页面，例如 `chrome://` 页面、扩展页面与浏览器商店。
_Avoid_: 非法页面

**受影响的标签页（Affected Tabs）**:
与清理目标相关的已打开标签页：当前站点模式下指同站点的全部标签页，全部站点模式下指全部可处理的 http(s) 标签页。清理后默认刷新它们。
_Avoid_: 目标标签页（容易被误解为只有一个）
