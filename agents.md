## 图片处理规则
- 所有图片素材尺寸不可预测，必须用 CSS 容器控制显示尺寸
- 图片容器必须设定固定宽高，图片用 object-fit: cover 或 contain
- 角色/敌人立绘用 object-fit: contain（不裁切）
- 纹理背景用 background-size: cover 或 512px 512px repeat
- 卡牌插画用 object-fit: cover + object-position: center
- 所有图片加 loading="lazy"

对应的基础 CSS：

```css
/* 图片容器通用方案 */
.img-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.img-contain {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}
```
