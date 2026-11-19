---
status: accepted
---

# Scope site-data clearing by origin with three execution channels

「清除站点数据」默认只清理**当前站点**（即浏览器的源：协议 + 主机 + 端口）的六类客户端状态——Cookie、localStorage、sessionStorage、IndexedDB、Cache Storage、Service Worker 注册——并保留一个需用户显式选择的**全部站点模式**。实现上三条执行通道分工：Cookie 统一走 `chrome.cookies`（按目标 URL 取数，可计数、可逐条删除，含父域 Cookie）；除 sessionStorage 外的存储类在当前站点模式走 `chrome.browsingData` 的 origins 过滤，全部站点模式走不带 origins 的全量清理；sessionStorage 只能通过 `chrome.scripting` 注入页面清空，因此仅覆盖已打开的标签页。

## Considered Options

- 全部走 `chrome.browsingData`：接口统一，但无法清理 sessionStorage，也不能按 origin 过滤 HTTP 缓存，且 Cookie 无法给出逐条计数。
- 全部走页面注入脚本：无需新增权限，但只能触达已打开页面的源，无法实现全部站点模式，也无法清理未打开站点的 localStorage / IndexedDB。
- 保持原有全量一键清除：实现最简，但与 README 与隐私政策承诺的「当前站点」矛盾，且会连带清除扩展自身与所有站点的 Cookie。

## Consequences

- 需要新增 `browsingData` 权限，商店审核材料与隐私政策需同步更新。
- 清理结果混合三种通道，必须按数据类型逐项汇报成功 / 失败 / 跳过。
- sessionStorage 无法覆盖已关闭的标签页，但它本就随标签页消亡，无需处理。
- HTTP 浏览器缓存不具备按站点清理的能力，明确不在一期范围。
- 旧的入口 id `clear-cookie` 与全量删除的 `chrome.cookies.removeAll` 一并移除，不做兼容别名。
