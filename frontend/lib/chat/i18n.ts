/**
 * 集中式文案。后续若要做多语言，只需在这里多加一份字典。
 * 所有 UI 字符串走这里，避免硬编码散落各处。
 */

export const t = {
  // 通用
  appName: "Generic Agent",
  appTagline: "通用智能体 · 优雅工作台",

  // 输入区
  inputPlaceholder: "向智能体提问，或粘贴图片… (Shift+Enter 换行)",
  attachImage: "添加图片",
  send: "发送",
  stop: "停止",
  removeAttachment: "移除附件",
  hintPasteImage: "可直接粘贴或拖拽图片",
  hintImageGen: '使用 "/image 描述" 直接生成图片',

  // 侧边栏
  toggleSidebar: "切换侧边栏",
  closeSidebar: "关闭侧边栏",
  sectionLLM: "模型后端",
  sectionSession: "会话",
  sectionDisplay: "显示",
  sectionAbout: "关于",
  reinjectPrompt: "重注入系统提示",
  reinjectDesc: "重新加载并注入 SystemPrompt（不清空历史）",
  fontSize: "字号",
  fontSmall: "小",
  fontMedium: "中",
  fontLarge: "大",
  switchModelFailed: "切换模型失败",
  reinjectDone: "已重新注入系统提示",
  reinjectFailed: "重注入失败",

  // 流区
  emptyTitle: "开始一段新对话",
  emptySubtitle: "智能体已就绪。下面是这个工作台的能力提示：",
  capAsk: "随时提问",
  capAskDesc: "支持流式输出、Markdown、代码高亮",
  capVision: "视觉输入",
  capVisionDesc: "粘贴 / 拖拽 / 上传图片，模型可直接读取",
  capImageGen: "对话生图",
  capImageGenDesc: '输入 "/image 一只穿宇航服的猫" 直接出图',
  capSlash: "斜杠命令",
  capSlashDesc: '"/session.x=y"、"/resume" 等会话操作',

  // 图片渲染
  openImage: "查看图片",
  downloadImage: "下载图片",
  openInNewTab: "新标签页打开",

  // 工具调用
  toolCalling: "正在调用工具",
  toolDone: "调用完成",
  viewDetails: "查看详情",

  // 错误
  genericError: "出错了",

  // 自定义 API
  sectionCustomLLM: "自定义 API",
  customLLMEmpty: "尚未添加自定义 API。",
  customLLMAdd: "添加 API",
  customLLMEdit: "编辑",
  customLLMDelete: "删除",
  customLLMSave: "保存",
  customLLMCancel: "取消",
  customLLMNamePh: "显示名称（如 DeepSeek Chat）",
  customLLMUrlPh: "Base URL（如 https://api.deepseek.com/v1）",
  customLLMKeyPh: "API Key",
  customLLMModelPh: "模型名（如 deepseek-chat）",
  customLLMSavedOk: "已保存",
  customLLMSavedFail: "保存失败",
  customLLMDeletedOk: "已删除",
  customLLMHint: "兼容 OpenAI /chat/completions 协议的服务皆可：DeepSeek、Kimi、智谱、Ollama、本地模型 等。新增条目写入 mykey.py，自动获得完整 Agent 能力（工具调用、Prompt 缓存等）。",
  customLLMNoToolHint: "",
}

export type Strings = typeof t

