# Parser Boundary

Parser 是纯逻辑层。UI 不写正则，不判断类型，只消费 `PipelineResult`。

## Group Order

UI 固定展示顺序：

1. 网络地址：`ip`、`url`
2. 命令：`command`
3. 路径：`path`

## IDs

Item ID 使用确定性格式：

```text
type:start:end:hash(value)
```

这避免 React key 抖动和复制状态漂移。

## Conflict Rules

- URL 优先于 URL 内部路径。
- 被丢弃候选进入 diagnostics。

## Display Value vs Copy Value

- `value` 是展示值。
- `copyValue` 是实际复制值。

长值可以视觉截断，但复制必须使用完整 `copyValue`。
