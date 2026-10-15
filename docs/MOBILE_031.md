# 0.3.1 手机反馈修复

- 全部50班新增真实顾客耐心倒计时。第1–5班每单70至50秒，第6–10班48秒，第11班后逐渐降至24秒；排队位置及同桌单额外留出备餐时间。红色10秒预警，到零失败，保留免费重开。
- 保留原有炉火/开锅调度规则、同桌保温、错料重做及原有800首通金币，不新增真实广告。茶增加20秒，续摊至少恢复25秒。
- 菜单、配方本、教学及切后台暂停倒计时和煎制，返回不补扣隐藏时间。
- 原生Canvas优先采用screenWidth/Height设置物理像素缓冲，触摸仍使用逻辑像素。可选resize重新测量；场景绘制覆盖全屏，交互控件避开安全区。取消手机固定放大上限；横宽屏按高度限制控件缩放并铺场景。
- 依据官方tt.createCanvas文档： https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/drawing/picture/tt-create-canvas
- 自动测试为模拟tt宿主，不等于真机结果。原生画布图片标记native-not-phone。用户手机实测和抖音测试版本上传由发布流程确认。
