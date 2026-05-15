# 峡谷会战沙盘

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 测试

```bash
npm run test
```

## 数据

- 地图底图：`峡谷会战地图.png`
- 本地持久化 key：`canyon-sand-table-v2`
- 当前实现采用 `Vite + TypeScript + Vitest`
- 路线只能连接默认相邻建筑，不能自连或重复连接；不限制同一节点的出向分支数量
- 场景用于保存不同队列配置；新增场景会创建一个空队列配置，可切回其他场景恢复其队列
- 每条路线边支持 `step` 所属演示步骤和 `pauseSeconds` 到点停顿秒数；可全量演示，也可按当前步骤分步演示

## 部署

构建产物在 `dist/`，可直接部署到任意静态服务器。
