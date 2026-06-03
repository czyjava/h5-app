<template>
  <ReplicaProxyLifecycleOverlay v-if="apiDebugPage" page-mode />

  <main v-else class="app-frame">
    <section
      class="phone-shell"
      :class="{
        onboarding: bootFlowVisible,
        guide: guideVisible,
        immersive:
          activeTab === 'assistant' ||
          activeTab === 'workDetail' ||
          activeTab === 'customDesign' ||
          activeTab === 'customDesignRecords' ||
          activeTab === 'vipPurchase',
      }"
      aria-label="装修 APP H5 复刻"
    >
      <header class="status-bar">
        <span>9:41</span>
        <span class="status-icons">5G 100%</span>
      </header>

      <section v-if="privacyVisible" class="privacy-page">
        <div class="launch-brand">
          <img :src="homeAiAssets.appLogo" alt="" />
          <span>
            <strong>AI装修大师</strong>
            <small>看见家的万千种可能</small>
          </span>
        </div>

        <section class="privacy-dialog" role="dialog" aria-modal="true" aria-label="个人信息保护指引">
          <h1>个人信息保护指引</h1>
          <p>
            感谢您信任并使用AI装修大师！我们十分重视您的个人信息和隐私保护。为了更好地保障您的个人权益，请您仔细阅读
            <a href="#" @click.prevent>《用户服务协议》</a>
            和
            <a href="#" @click.prevent>《隐私政策》</a>
            。
          </p>
          <p>
            这将帮助您详细了解我们对信息的收集、使用方式，以便您更好地了解我们的服务并作出适当选择。如您同意用户服务协议和隐私政策，请单击“同意并继续”。
          </p>
          <p>若点击“不同意”，则相关服务不可用。后续您可以在 我的-右上角设置图标-隐私政策 中查看。</p>
          <footer>
            <button type="button" class="privacy-secondary" @click="showToast('需要同意隐私政策后才能继续体验')">不同意</button>
            <button type="button" class="privacy-primary" @click="acceptPrivacy">同意并继续</button>
          </footer>
        </section>
      </section>

      <section v-else-if="onboardingVisible" class="onboarding-page">
        <header class="onboarding-hero">
          <button v-if="onboardingStep === 'source'" type="button" class="text-button" @click="onboardingStep = 'role'">上一步</button>
          <button type="button" class="text-button skip" @click="completeOnboarding">暂时跳过</button>
          <img :src="homeAiAssets.loginTitle" alt="欢迎使用AI装修大师" />
          <strong v-if="onboardingStep === 'role'">为了更好地为您服务，可以告诉我您的身份吗？</strong>
          <strong v-else>您是如何找到我们的？</strong>
          <span v-if="onboardingStep === 'source'">选择一个来源，帮助 HomeAI 后续推荐更合适的入口。</span>
        </header>

        <section v-if="onboardingStep === 'role'" class="role-question">
          <button v-for="role in roles" :key="role.label" type="button" class="role-card" @click="selectOnboardingRole(role.label)">
            <img :src="role.image" alt="" />
            <span>
              <strong>{{ role.label }}</strong>
              <small>{{ role.subtitle }}</small>
            </span>
            <ChevronRight :size="26" />
          </button>
        </section>

        <section v-else class="source-question">
          <button
            v-for="source in sourceOptions"
            :key="source.label"
            type="button"
            :class="{ active: selectedSource === source.label }"
            @click="selectedSource = source.label"
          >
            <span class="source-icon" :style="{ '--source-bg': source.color }">{{ source.icon }}</span>
            <strong>{{ source.label }}</strong>
            <span class="radio-dot" aria-hidden="true"></span>
          </button>
        </section>

        <footer v-if="onboardingStep === 'source'" class="onboarding-actions">
          <button type="button" class="secondary-button" @click="onboardingStep = 'role'">上一步</button>
          <button type="button" class="next-button" :disabled="onboardingStep === 'source' && !selectedSource" @click="finishOnboardingStep">
            下一步
          </button>
        </footer>
      </section>

      <section v-else-if="guideVisible" class="guide-page">
        <div class="guide-visual">
          <img class="guide-poster" :src="activeGuide.poster" alt="" />
          <span class="original-badge">
            <img :src="activeGuide.original" alt="" />
            <strong>原图</strong>
          </span>
        </div>
        <section class="guide-copy">
          <strong>{{ activeGuide.title }}</strong>
          <span>{{ activeGuide.subtitle }}</span>
        </section>
        <button type="button" class="guide-next" @click="nextGuide">
          {{ guideStep === guideSlides.length - 1 ? '开始体验' : '下一步' }}
        </button>
      </section>

      <section v-else class="screen">
        <section v-if="activeTab === 'home'" class="page page-home native-home" @scroll.passive="isScrolled = true">
          <header class="home-native-head">
            <button type="button" class="member-pill" @click="openVipPurchasePage('manual')">
              <span>👑</span>
              开通会员
            </button>
          </header>

          <section class="native-feature-list">
            <button v-for="feature in homeCards" :key="feature.code" type="button" class="native-feature-card" @click="selectFeature(feature.code)">
              <div class="native-feature-media">
                <img :src="feature.image" alt="" />
                <span class="compare-line"></span>
              </div>
              <footer>
                <span>
                  <strong>{{ feature.title }}</strong>
                  <small>{{ feature.subtitle }}</small>
                </span>
                <span class="try-button">
                  <WandSparkles :size="19" />
                  去试试
                </span>
              </footer>
            </button>
          </section>
        </section>

        <section v-else-if="activeTab === 'design'" class="page page-design">
          <header class="page-header">
            <button class="icon-button" type="button" aria-label="返回首页" @click="activeTab = 'home'">
              <ChevronLeft :size="20" />
            </button>
            <strong>{{ selectedFeature.title }}</strong>
            <button class="icon-button" type="button" aria-label="重置设计" @click="resetDesign">
              <X :size="18" />
            </button>
          </header>

          <div class="step-indicator">
            <span v-for="(_, index) in designSteps" :key="index" :class="{ active: index <= designStep }"></span>
          </div>

          <section v-if="currentStep === 'upload'" class="design-panel upload-panel">
            <img class="upload-art" :src="selectedFeature.guideImage" alt="" />
            <h2>上传空间照片</h2>
            <p>HomeAI 会识别房间结构，再生成对应的装修方案。</p>
            <button class="upload-zone" type="button" @click="selectDesignInputImage">
              <img :src="homeAiAssets.upload" alt="" />
              <span>{{ selectedImageName || '从相册选择图片' }}</span>
            </button>
            <div class="guide-compare">
              <figure>
                <img :src="selectedFeature.guideImage" alt="" />
                <figcaption>光线清晰</figcaption>
              </figure>
              <figure v-if="selectedFeature.badImage">
                <img :src="selectedFeature.badImage" alt="" />
                <figcaption>避免遮挡</figcaption>
              </figure>
            </div>
          </section>

          <section v-else-if="currentStep === 'style'" class="design-panel style-panel">
            <h2>选择装修风格</h2>
            <p>保留原空间轮廓，调整软装、色彩和材质。</p>
            <div class="chip-grid">
              <button
                v-for="style in styles"
                :key="style"
                class="select-chip"
                :class="{ active: style === selectedStyle }"
                type="button"
                @click="selectedStyle = style"
              >
                {{ style }}
              </button>
            </div>
            <div class="tool-strip">
              <button v-for="tool in designTools" :key="tool.label" type="button" class="tool-button" @click="showToast(`${tool.label} 工具已选中`)">
                <img :src="tool.icon" alt="" />
                <span>{{ tool.label }}</span>
              </button>
            </div>
          </section>

          <section v-else class="design-panel result-panel">
            <img class="detecting" :src="homeAiAssets.objectDetecting" alt="" />
            <h2>AI 正在生成装修方案</h2>
            <p>{{ selectedFeature.title }} · {{ selectedStyle }}</p>
            <div class="result-preview">
              <img :src="selectedFeature.guideImage" alt="" />
              <div>
                <strong>生成任务已准备</strong>
                <span>真实生成接口可在 Network 面板中对照代理请求。</span>
              </div>
            </div>
            <button class="custom-design-entry" type="button" @click="openCustomDesignFromResult()">定制设计</button>
            <button class="custom-design-entry secondary" type="button" @click="openCustomDesignFromFeedback">不满意，帮我修改</button>
          </section>

          <button class="bottom-action" type="button" @click="nextDesignStep">
            {{ designStep === designSteps.length - 1 ? '再做一张' : '下一步' }}
          </button>
        </section>

        <section v-else-if="activeTab === 'workDetail' && selectedWork" class="page page-work-detail">
          <header class="work-detail-header">
            <button class="icon-button" type="button" aria-label="返回我的" @click="activeTab = 'mine'">
              <ChevronLeft :size="20" />
            </button>
            <strong>作品详情</strong>
            <button class="work-record-pill" type="button" :disabled="workDetailLoading" @click="refreshSelectedWorkDetail">
              {{ workDetailLoading ? '加载' : '刷新' }}
            </button>
          </header>

          <p v-if="workDetailError" class="work-detail-error">{{ workDetailError }}</p>

          <section class="work-detail-hero">
            <img :src="selectedWork.coverUrl" alt="作品图" />
            <div>
              <strong>{{ selectedWork.title }}</strong>
              <span>{{ formatWorkDisplayMeta(selectedWork) }}</span>
            </div>
          </section>

          <section class="work-detail-meta">
            <article>
              <small>生成批次</small>
              <strong>{{ selectedGenerationWorks.length }} 张</strong>
            </article>
            <article>
              <small>当前方案</small>
              <strong>{{ selectedGenerationWorkIndexText }}</strong>
            </article>
            <article>
              <small>定制设计</small>
              <strong>{{ workDetailCustomDesignDisabled ? '不可用' : '可继续修改' }}</strong>
            </article>
          </section>

          <section class="work-group-section">
            <header>
              <h3>同组作品</h3>
              <span>{{ selectedGenerationWorks.length }} 个作品</span>
            </header>
            <div class="work-group-list">
              <button
                v-for="work in selectedGenerationWorks"
                :key="work.id"
                type="button"
                :class="{ active: work.id === selectedWork.id }"
                @click="selectGenerationWork(work)"
              >
                <img :src="work.coverUrl" alt="" />
                <span>{{ work.title }}</span>
              </button>
            </div>
          </section>

          <section class="work-detail-actions">
            <button type="button" class="work-detail-design-button" :disabled="workDetailCustomDesignDisabled" @click="openCustomDesignFromSelectedWork">
              <span>{{ workDetailLoading ? '加载作品中' : '基于这张图定制设计' }}</span>
              <ChevronRight :size="18" />
            </button>
          </section>
        </section>

        <section v-else-if="activeTab === 'customDesign'" class="page page-custom-design">
          <header class="custom-design-header">
            <button class="custom-round-button" type="button" aria-label="返回" @click="closeCustomDesignPage">
              <ChevronLeft :size="21" />
            </button>
            <strong>定制设计</strong>
            <span class="custom-header-actions">
              <button class="custom-round-button" type="button" aria-label="重置" @click="resetCustomDesignPage">
                <X :size="18" />
              </button>
            </span>
          </header>

          <section class="custom-chat-panel">
            <section class="custom-chat-scroll" aria-label="定制设计对话">
              <article class="custom-chat-message ai source">
                <span class="custom-chat-avatar">AI</span>
                <section class="custom-chat-bubble">
                  <strong>基于当前作品定制设计</strong>
                  <span>告诉我你想调整的风格、颜色、软装或空间问题，我会基于这张图生成新的设计。</span>
                  <figure class="custom-chat-image source">
                    <img v-if="customDesignContext?.imageUrl" :src="customDesignContext.imageUrl" alt="定制设计源图" @error="handleCustomDesignImageError" />
                    <figcaption>{{ customDesignContext?.workTitle || '当前作品' }}</figcaption>
                  </figure>
                </section>
              </article>

              <template v-for="record in customDesignChatRecords" :key="record.recordKey">
                <article class="custom-chat-message user">
                  <section class="custom-chat-bubble">
                    <figure v-if="record.inputImageUrl" class="custom-chat-image input">
                      <img :src="record.inputImageUrl" alt="本轮参考图" @error="handleCustomDesignImageError" />
                    </figure>
                    <span>{{ record.prompt }}</span>
                  </section>
                </article>

                <article class="custom-chat-message ai">
                  <span class="custom-chat-avatar">AI</span>
                  <section class="custom-chat-bubble result" :class="record.status">
                    <header>
                      <strong>{{ customDesignRecordChatTitle(record) }}</strong>
                      <small>{{ record.createdAt }}</small>
                    </header>

                    <figure v-if="record.outputImageUrl" class="custom-chat-image result">
                      <img :src="record.outputImageUrl" alt="定制设计结果图" @error="handleCustomDesignImageError" />
                    </figure>

                    <section v-else-if="record.assistantText" class="custom-chat-text-reply">
                      <span>{{ record.assistantText }}</span>
                    </section>

                    <section v-else-if="record.status === 'failed'" class="custom-chat-state failed">
                      <strong>生成失败</strong>
                      <span>可以调整描述后重新生成。</span>
                    </section>

                    <section v-else class="custom-chat-state processing">
                      <span class="custom-spinner"></span>
                      <strong>AI 正在重新设计</strong>
                      <span>会保留原始空间结构，调整风格、软装和细节。</span>
                    </section>

                    <footer v-if="record.outputImageUrl || record.assistantText" class="custom-chat-actions">
                      <section class="custom-chat-feedback-actions" aria-label="反馈">
                        <button type="button" :class="{ active: record.feedback === 'unsatisfied' }" @click="markCustomDesignFeedback(record, 'unsatisfied')">
                          <ThumbsDown :size="14" />
                          <span>不满意</span>
                        </button>
                        <button type="button" :class="{ active: record.feedback === 'satisfied' }" @click="markCustomDesignFeedback(record, 'satisfied')">
                          <ThumbsUp :size="14" />
                          <span>满意</span>
                        </button>
                      </section>

                      <section v-if="record.outputImageUrl" class="custom-chat-result-actions" aria-label="结果操作">
                        <button type="button" :disabled="customDesignBusy" @click="regenerateCustomDesignFromRecord(record)">
                          <RefreshCcw :size="14" />
                          <span>重新生成</span>
                        </button>
                        <button type="button" :disabled="customDesignBusy" @click="startModifyCustomDesignFromRecord(record)">
                          <Pencil :size="14" />
                          <span>修改</span>
                        </button>
                        <button
                          type="button"
                          class="apply"
                          :disabled="record.status === 'applied' || customDesignApplyingCode === record.processRecordCode"
                          @click="applyCustomDesignRecordResult(record)"
                        >
                          {{ customDesignRecordApplyButtonText(record) }}
                        </button>
                      </section>
                    </footer>

                    <footer v-else-if="record.status === 'failed'" class="custom-chat-actions">
                      <section class="custom-chat-result-actions" aria-label="失败操作">
                        <button type="button" :disabled="customDesignBusy" @click="regenerateCustomDesignFromRecord(record)">
                          <RefreshCcw :size="14" />
                          <span>重新生成</span>
                        </button>
                      </section>
                    </footer>
                  </section>
                </article>
              </template>
            </section>

            <section class="custom-chat-composer-panel">
              <section v-if="customPromptExamplesVisible" class="custom-prompt-examples" aria-label="定制设计示例">
                <button
                  v-for="example in customDesignPromptExamples"
                  :key="example"
                  type="button"
                  :disabled="customDesignBusy"
                  @click="useCustomDesignPromptExample(example)"
                >
                  {{ example }}
                </button>
              </section>

              <section v-if="customStylePanelVisible" class="custom-style-strip" aria-label="风格选择">
                <button v-for="style in customDesignStyles" :key="style.code" type="button" :disabled="customDesignBusy" @click="submitCustomDesignStyle(style)">
                  <img :src="style.image" alt="" />
                  <span>{{ style.name }}</span>
                </button>
              </section>

              <section v-if="customDesignDraftReferenceImageUrl" class="custom-reference-preview" aria-label="本轮参考图">
                <img :src="customDesignDraftReferenceImageUrl" alt="" @error="handleCustomDesignImageError" />
                <span>将基于这张图修改</span>
                <button type="button" aria-label="移除参考图" @click="clearCustomDesignDraftReferenceImage">
                  <X :size="15" />
                </button>
              </section>

              <section class="custom-composer">
                <button
                  type="button"
                  class="custom-style-toggle"
                  :class="{ active: customStylePanelVisible }"
                  :disabled="customDesignBusy"
                  aria-label="选择风格"
                  title="选择风格"
                  @click="customStylePanelVisible = !customStylePanelVisible"
                >
                  <WandSparkles :size="19" />
                </button>
                <input
                  v-model="customDesignInput"
                  type="text"
                  :disabled="customDesignBusy"
                  placeholder="描述你想调整的风格或问题"
                  @keydown.enter.prevent="submitCustomDesignText"
                />
                <button type="button" class="custom-send-button" :disabled="customDesignSubmitDisabled" @click="submitCustomDesignText">发送</button>
              </section>
            </section>
          </section>
        </section>

        <section v-else-if="activeTab === 'customDesignRecords'" class="page page-custom-records">
          <header class="custom-records-header">
            <button class="custom-records-back" type="button" aria-label="返回定制设计" @click="activeTab = 'customDesign'">
              <ChevronLeft :size="21" />
            </button>
            <div>
              <strong>过程记录</strong>
              <small>{{ customDesignRecordsSubtitle }}</small>
            </div>
          </header>

          <section class="custom-record-summary">
            <article>
              <span>{{ visibleCustomDesignProcessRecords.length }}</span>
              <small>修改次数</small>
            </article>
            <article>
              <span>{{ completedCustomDesignRecordCount }}</span>
              <small>已完成</small>
            </article>
            <article>
              <span>{{ pendingCustomDesignRecordCount }}</span>
              <small>等待结果</small>
            </article>
          </section>

          <section v-if="visibleCustomDesignProcessRecords.length === 0" class="custom-record-empty">
            <strong>{{ customDesignRecordsLoading ? '正在加载过程记录' : '暂无过程记录' }}</strong>
            <span>{{ customDesignRecordsLoading ? '正在从业务服务读取这个作品的定制设计过程。' : '从这个作品发起一次定制设计后，这里会记录它对应的修改意图、状态和结果图。' }}</span>
            <button type="button" @click="activeTab = 'customDesign'">返回定制设计</button>
          </section>

          <section v-else class="custom-record-list">
            <article v-for="record in visibleCustomDesignProcessRecords" :key="record.recordKey" class="custom-record-card">
              <header>
                <span :class="['custom-record-status', record.status]">{{ customDesignRecordStatusText(record.status) }}</span>
                <small>{{ record.createdAt }}</small>
              </header>
              <section class="custom-record-images">
                <figure>
                  <img :src="record.inputImageUrl" alt="" />
                  <figcaption>输入图</figcaption>
                </figure>
                <figure :class="{ pending: !record.outputImageUrl }">
                  <img v-if="record.outputImageUrl" :src="record.outputImageUrl" alt="" />
                  <span v-else>{{ customDesignOutputPlaceholderText(record) }}</span>
                  <figcaption>输出图</figcaption>
                </figure>
              </section>
              <section class="custom-record-body">
                <strong>{{ record.prompt }}</strong>
                <span>基于当前作品修改</span>
              </section>
              <footer v-if="record.status === 'completed'">
                <button type="button" @click="showCustomDesignRecordResult(record)">查看结果</button>
                <button type="button" @click="continueCustomDesignFromRecord(record)">继续修改</button>
                <button
                  type="button"
                  :disabled="customDesignApplyingCode === record.processRecordCode"
                  @click="applyCustomDesignRecordResult(record)"
                >
                  {{ customDesignApplyingCode === record.processRecordCode ? '应用中' : '应用设计' }}
                </button>
              </footer>
              <footer v-else-if="record.status === 'applied'">
                <button type="button" @click="showCustomDesignRecordResult(record)">查看结果</button>
                <button type="button" @click="continueCustomDesignFromRecord(record)">继续修改</button>
                <button type="button" disabled>已应用</button>
              </footer>
              <footer v-else-if="record.status === 'failed'">
                <button type="button" @click="continueCustomDesignFromRecord(record)">重新生成</button>
              </footer>
              <footer v-else-if="record.status === 'submitted'">
                <span class="custom-record-pending-text">等待结果返回后可查看输出图和应用设计</span>
              </footer>
              <footer v-else>
                <span class="custom-record-pending-text">等待结果返回后可查看输出图和应用设计</span>
              </footer>
            </article>
          </section>
        </section>

        <section v-else-if="activeTab === 'assistant'" class="page page-assistant">
          <header class="assistant-header">
            <button class="icon-button" type="button" aria-label="返回首页" @click="activeTab = 'home'">
              <ChevronLeft :size="20" />
            </button>
            <strong>{{ assistantPageTitle }}</strong>
            <button class="assistant-new-button" type="button" :disabled="assistantSending" @click="startManualAssistantSession">新会话</button>
          </header>
          <section class="assistant-chat">
            <div v-if="assistantWorkContext" class="assistant-context-pill">
              <span>最近作品 {{ assistantWorkContext.workId }}</span>
              <small>模板 {{ assistantWorkContext.templateId || '-' }}</small>
            </div>
            <section class="assistant-message-panel">
              <div ref="assistantMessageScroller" class="assistant-message-list" :class="{ empty: assistantMessages.length === 0 }">
                <section v-if="assistantMessages.length === 0" class="assistant-empty-state">
                  <span class="assistant-empty-avatar" aria-hidden="true">
                    <img :src="homeAiAssets.magicWand" alt="" />
                  </span>
                  <strong>{{ assistantEmptyTitle }}</strong>
                  <p>{{ assistantEmptyDescription }}</p>
                  <div class="assistant-quick-list" aria-label="常用问题">
                    <button
                      v-for="question in assistantQuickQuestions"
                      :key="question"
                      type="button"
                      :disabled="assistantComposerDisabled"
                      @click="useAssistantQuickQuestion(question)"
                    >
                      {{ question }}
                    </button>
                  </div>
                </section>
                <article
                  v-for="message in advancedChatMessages"
                  v-else
                  :key="message._id"
                  class="assistant-message-row"
                  :class="{
                    user: message.senderId === ADVANCED_CHAT_CURRENT_USER_ID,
                    failed: message.failure,
                    'image-only': message.files?.length && !message.content,
                  }"
                >
                  <span v-if="message.senderId !== ADVANCED_CHAT_CURRENT_USER_ID" class="assistant-message-avatar" aria-hidden="true">
                    <img :src="message.avatar" alt="" />
                  </span>
                  <div class="assistant-message-content">
                    <div class="assistant-message-bubble">
                      <img
                        v-if="message.senderId === ADVANCED_CHAT_CURRENT_USER_ID && message.files?.[0]?.url"
                        class="assistant-message-image"
                        :src="message.files[0].url"
                        alt="用户上传的设计参考图"
                        @click="openAssistantMessageImage(message.files[0].url)"
                      />
                      <p v-if="message.content">{{ message.content }}</p>
                    </div>
                    <time>{{ message.timestamp }}</time>
                  </div>
                  <span v-if="message.senderId === ADVANCED_CHAT_CURRENT_USER_ID" class="assistant-message-avatar user-avatar" aria-hidden="true">
                    <img :src="message.avatar" alt="" />
                  </span>
                </article>
              </div>

              <footer class="assistant-composer">
                <div v-if="assistantImageUrls.length" class="assistant-attachment-preview">
                  <button type="button" aria-label="预览已添加图片" @click="openAssistantMessageImage(assistantImageUrls[0])">
                    <img :src="assistantImageUrls[0]" alt="已添加的设计参考图" />
                    <span>1/1</span>
                  </button>
                  <button type="button" aria-label="移除已添加图片" @click="removeAssistantAttachment">
                    <X :size="14" />
                  </button>
                </div>
                <div v-if="assistantAttachmentMenuVisible" class="assistant-attachment-menu" role="menu" aria-label="选择图片来源">
                  <button type="button" role="menuitem" @click="openAssistantFilePicker(true)">
                    <Camera :size="18" />
                    拍照
                  </button>
                  <button type="button" role="menuitem" @click="openAssistantFilePicker(false)">
                    <ImageIcon :size="18" />
                    相册
                  </button>
                </div>
                <input
                  ref="assistantFileInputElement"
                  class="assistant-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  :capture="assistantFileCapture ? 'environment' : undefined"
                  @change="handleAssistantNativeFileChange"
                />
                <div class="assistant-composer-row">
                  <button
                    class="assistant-icon-action"
                    type="button"
                    aria-label="添加图片附件"
                    :disabled="assistantComposerDisabled || assistantSceneType !== 'ASSISTANT_CHAT'"
                    @click="toggleAssistantAttachmentMenu"
                  >
                    <Plus :size="20" />
                  </button>
                  <textarea
                    v-model="assistantInput"
                    rows="1"
                    :placeholder="assistantComposerPlaceholder"
                    :disabled="assistantComposerDisabled"
                    @keydown.enter.exact.prevent="submitAssistantComposer"
                  ></textarea>
                  <button class="assistant-send-action" type="button" :disabled="assistantSendDisabled" aria-label="发送消息" @click="submitAssistantComposer">
                    <SendHorizontal :size="18" />
                  </button>
                </div>
              </footer>
            </section>
          </section>
        </section>

        <section v-else-if="activeTab === 'discover'" class="page page-discover">
          <header class="page-title-row">
            <div>
              <p>发现</p>
              <h2>真实空间灵感库</h2>
            </div>
            <img :src="homeAiAssets.discoverScreen" alt="" />
          </header>
          <div class="category-tabs">
            <button
              v-for="category in discoverCategories"
              :key="category"
              :class="{ active: category === activeDiscoverCategory }"
              type="button"
              @click="activeDiscoverCategory = category"
            >
              {{ category }}
            </button>
          </div>
          <section class="discover-grid">
            <article v-for="item in filteredDiscover" :key="item.title" class="discover-card">
              <img :src="item.coverUrl" alt="" />
              <strong>{{ item.title }}</strong>
              <span>{{ item.subtitle }}</span>
            </article>
          </section>
        </section>

        <section v-else-if="activeTab === 'vipPurchase'" class="page page-vip-purchase">
          <header class="vip-purchase-head">
            <button class="icon-button" type="button" :aria-label="vipPurchaseBackLabel" @click="returnFromVipPurchase">
              <ChevronLeft :size="20" />
            </button>
            <strong>AI装修大师 VIP</strong>
            <span></span>
          </header>
          <section class="vip-purchase-hero">
            <img :src="homeAiAssets.vipFontLogo" alt="VIP" />
            <h2>{{ vipPurchaseTitle }}</h2>
            <p>{{ vipPurchaseDescription }}</p>
          </section>
          <section class="vip-purchase-benefits">
            <article>
              <strong>不限对话轮数</strong>
              <span>超过免费体验轮数后，开通会员可继续使用 AI 设计助手。</span>
            </article>
            <article>
              <strong>不限助手会话</strong>
              <span>支持持续创建和恢复你的装修咨询上下文。</span>
            </article>
            <article>
              <strong>定制设计权益</strong>
              <span>用于作品修改、方案细化和更多会员能力。</span>
            </article>
          </section>
          <p v-if="vipPurchaseStatusText" class="vip-purchase-status">{{ vipPurchaseStatusText }}</p>
          <button type="button" class="vip-purchase-action" :disabled="vipPurchaseLoading" @click="loadVipPurchaseChannel">
            {{ vipPurchaseLoading ? '加载会员方案' : '继续开通会员' }}
          </button>
        </section>

        <section v-else class="page page-mine">
          <header class="profile-head">
            <img :src="homeAiAssets.appLogo" alt="" />
            <div>
              <h2>{{ snapshot.user.nickname }}</h2>
              <p>{{ profileUserHint }}</p>
            </div>
            <span>{{ snapshot.user.vipLabel }}</span>
            <button class="profile-settings-button" type="button" aria-label="登录与接口配置" @click="settingsDialogVisible = true">
              <Settings :size="18" />
            </button>
          </header>

          <button type="button" class="vip-card" @click="openVipPurchasePage('manual')">
            <img :src="homeAiAssets.vipCardBg" alt="" />
            <div>
              <img :src="homeAiAssets.vipFontLogo" alt="VIP" />
              <strong>{{ snapshot.user.diamondCount }} 钻石</strong>
              <span>会员权益与余额同步展示</span>
            </div>
          </button>

          <nav class="mine-tabs" aria-label="我的内容切换">
            <button type="button" :class="{ active: mineTab === 'works' }" @click="chooseMineTab('works')">作品</button>
            <button type="button" :class="{ active: mineTab === 'assistant' }" @click="chooseMineTab('assistant')">助手</button>
          </nav>

          <section v-if="mineTab === 'works'" class="work-list">
            <header>
              <h3>我的作品</h3>
              <button type="button" :disabled="workListLoading" @click="refreshWorkList">
                {{ workListLoading ? '加载中' : '刷新' }}
              </button>
            </header>
            <p v-if="workListError" class="work-list-error">{{ workListError }}</p>
            <p v-if="workListLoading && displayWorks.length === 0" class="work-list-empty">正在加载作品...</p>
            <p v-else-if="displayWorks.length === 0" class="work-list-empty">暂无作品</p>
            <article v-for="work in displayWorks" :key="work.id" class="work-row">
              <img :src="work.coverUrl" alt="" />
              <div class="work-info">
                <strong>{{ work.title }}</strong>
                <span>{{ formatWorkDisplayMeta(work) }}</span>
              </div>
              <button type="button" class="custom" @click="openWorkDetail(work)">查看详情</button>
            </article>
          </section>

          <section v-else class="assistant-history-list">
            <header>
              <h3>助手</h3>
              <button type="button" :disabled="assistantHistoryLoading" @click="loadAssistantHistory">
                {{ assistantHistoryLoading ? '加载中' : '刷新' }}
              </button>
            </header>
            <p v-if="assistantHistoryError" class="assistant-history-error">{{ assistantHistoryError }}</p>
            <p v-if="assistantHistoryLoading && assistantHistorySessions.length === 0" class="assistant-history-empty">正在加载助手会话...</p>
            <p v-else-if="assistantHistorySessions.length === 0" class="assistant-history-empty">暂无助手会话</p>
            <section v-for="group in assistantHistoryGroups" :key="group.label" class="assistant-history-group">
              <h4>{{ group.label }}</h4>
              <button
                v-for="session in group.sessions"
                :key="session.sessionKey"
                type="button"
                class="assistant-history-card"
                @click="openAssistantHistorySession(session)"
              >
                <span class="assistant-history-icon-wrap">
                  <img class="assistant-history-icon" :src="homeAiAssets.magicWand" alt="" />
                </span>
                <span class="assistant-history-copy">
                  <strong>{{ formatAssistantHistoryTitle(session) }}</strong>
                  <small>{{ formatAssistantHistorySubtitle(session) }}</small>
                </span>
                <span class="assistant-history-meta">
                  <span class="assistant-history-time">{{ formatAssistantHistoryTime(session) }}</span>
                  <ChevronRight class="assistant-history-arrow" :size="16" aria-hidden="true" />
                </span>
              </button>
            </section>
          </section>
        </section>
      </section>

      <nav
        v-if="
          !bootFlowVisible &&
          activeTab !== 'assistant' &&
          activeTab !== 'workDetail' &&
          activeTab !== 'customDesign' &&
          activeTab !== 'customDesignRecords' &&
          activeTab !== 'vipPurchase'
        "
        class="bottom-nav"
      >
        <button v-for="tab in tabs" :key="tab.key" type="button" :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          <img :src="tab.icon" alt="" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </section>

    <section v-if="settingsDialogVisible" class="settings-modal" role="dialog" aria-modal="true" aria-label="登录与接口环境配置">
      <button class="settings-modal-mask" type="button" aria-label="关闭配置弹窗" @click="settingsDialogVisible = false"></button>
      <section class="settings-modal-panel">
        <header>
          <div>
            <strong>登录与接口环境</strong>
            <small>{{ environmentOptions.find((option) => option.key === environment)?.label }} · {{ apiState.mode }}</small>
          </div>
          <button type="button" aria-label="关闭配置弹窗" @click="settingsDialogVisible = false">
            <X :size="18" />
          </button>
        </header>
        <ReplicaSettingsPanel
          :environments="environmentOptions"
          :active-environment="environment"
          :switching-environment="switchingEnvironment"
          :rows="[]"
          @choose-environment="chooseEnvironment"
          @row-click="handleSettingRow"
        />
        <form class="settings-address-panel" @submit.prevent="persistBusinessTargets">
          <header>
            <strong>业务访问地址</strong>
            <small>当前请求：{{ normalizedBusinessTarget }}</small>
          </header>
          <label v-for="target in businessTargetRows" :key="target.key">
            <span>{{ target.inputLabel }}</span>
            <input v-model.trim="businessTargetDrafts[target.key]" type="url" inputmode="url" autocomplete="off" />
          </label>
          <div class="settings-address-actions">
            <button type="button" @click="restoreDefaultBusinessTargets">恢复默认</button>
            <button type="submit">保存访问地址</button>
          </div>
        </form>
        <ReplicaApiModePanel
          :auth-token="authTokenDraft"
          empty-token-label="未配置"
          :reload-handler="reload"
          :send-code-handler="sendLoginSmsCode"
          :login-handler="loginWithSmsCode"
          :clear-token-handler="clearLogin"
          @update:auth-token="updateAuthToken"
          @notice="showToast"
          @error="showToast"
        />
        <section class="settings-user-panel" aria-label="当前用户信息">
          <span>
            <strong>User ID</strong>
            <small>{{ settingsUserIdText }}</small>
          </span>
          <button type="button" :disabled="!settingsUserIdCopyable" @click="copySettingsUserId">
            <Copy :size="16" />
            复制
          </button>
        </section>
        <div class="settings-row-list">
          <button v-for="row in settingRows" :key="row.key" type="button" @click="handleSettingRow(row)">
            <UserRound v-if="row.key === 'profile'" :size="20" />
            <MessageSquare v-else :size="20" />
            <span>{{ row.label }}</span>
            <ChevronRight :size="18" />
          </button>
        </div>
        <p v-if="apiState.lastError" class="settings-error">{{ apiState.lastError }}</p>
      </section>
    </section>

    <p v-if="toastMessage" class="toast-message" :class="toastKind">{{ toastMessage }}</p>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  SendHorizontal,
  Settings,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-vue-next';
import {
  createSmsAuthClient,
  createReplicaSession,
  persistReplicaAuthToken,
  persistReplicaEnvironment,
  type ReplicaEnvironment,
} from '@wmxs/h5-replica-common/client';
import {
  ReplicaApiModePanel,
  ReplicaProxyLifecycleOverlay,
  ReplicaSettingsPanel,
  type ReplicaLoginPayload,
  type ReplicaSettingsRow,
} from '@wmxs/h5-replica-common/ui';
import { homeAiReplicaConfig } from '../../app.config';
import { homeAiAssets } from '../shared/assets';
import { appShellSnapshot } from '../shared/appShellData';
import { shouldRequireAssistantLogin, shouldUseLocalAssistantExperience } from '../shared/designAssistantMode';
import { findAssistantCompletedReply, shouldDisableAssistantComposer } from '../shared/designAssistantMessageUi';
import {
  listDesignAssistantSessions,
  listDesignAssistantMessages,
  resolveAssistantImageUrl,
  resolveAssistantText,
  sendDesignAssistantMessage,
  startDesignAssistantSession,
} from '../shared/designAssistantApi';
import {
  applyHomeAiCustomDesign,
  fetchHomeAiCustomDesign,
  listHomeAiCustomDesignRecords,
  resolveCustomDesignRecordInputImageUrl,
  resolveCustomDesignRecordOutputImageUrl,
  resolveCustomDesignOutputImageUrl,
  submitHomeAiCustomDesign,
  type CustomDesignRecordItemResponse,
} from '../shared/customDesignApi';
import { getHomeAiGenerationDetail, listHomeAiWorks, loadHomeAiSnapshot, requestBusiness, uploadHomeAiImage } from '../shared/homeaiApi';
import { loadHomeAiLocalAuthToken, persistHomeAiLocalAuthToken } from '../shared/localAuthTokenApi';
import type { HomeAiGenerationDetail } from '../shared/homeaiMappers';
import type { DesignAssistantMessage, DesignAssistantSessionItem, DesignFeature, HomeAiApiState, HomeAiSnapshot, MainTab, WorkItem } from '../shared/types';

type AssistantUiMessage = DesignAssistantMessage & {
  localId?: string;
};

interface AdvancedChatMessageFile {
  name: string;
  type: string;
  extension: string;
  url: string;
  preview?: string;
  size?: number;
}

interface AdvancedChatMessage {
  _id: string;
  senderId: string;
  content: string;
  username: string;
  avatar: string;
  date: string;
  timestamp: string;
  saved: boolean;
  distributed: boolean;
  seen: boolean;
  failure: boolean;
  disableActions: boolean;
  disableReactions: boolean;
  files?: AdvancedChatMessageFile[];
}

interface AssistantHistorySession extends DesignAssistantSessionItem {
  firstUserText: string;
  lastPreviewText: string;
  lastUserMessageTime?: string | number | null;
  summaryLoaded?: boolean;
}

interface AssistantSendOptions {
  prompt?: string;
  imageUrls?: string[];
  suppressBusyToast?: boolean;
}

interface CustomDesignPageContext {
  batchNo: string;
  workId?: string;
  recordId?: string;
  templateCode?: string;
  templateId?: string;
  imageUrl: string;
  workTitle?: string;
}

interface CustomDesignImageEntry {
  localId: string;
  imageUrl: string;
  encodedData?: string;
  customDesignCode?: string;
  isOriginal: boolean;
}

type CustomDesignStatus = 'idle' | 'processing' | 'completed' | 'failed';

type CustomDesignProcessStatus = 'submitted' | 'processing' | 'waitingUserInput' | 'completed' | 'applied' | 'failed';

interface CustomDesignProcessRecord {
  recordKey: string;
  processRecordCode: string;
  generationRecordId: string;
  sourceWorkId: string;
  prompt: string;
  templateCode: string;
  status: CustomDesignProcessStatus;
  inputImageUrl: string;
  assistantText?: string;
  outputImageUrl?: string;
  outputImageLocalId?: string;
  feedback?: 'satisfied' | 'unsatisfied';
  appliedAt?: string;
  createdAt: string;
}

const API_DEBUG_HASH = '#/api-debug';
const ASSISTANT_REPLY_POLL_INTERVAL_MS = 1500;
const ASSISTANT_REPLY_POLL_TIMEOUT_MS = 180000;
const CUSTOM_DESIGN_FETCH_INTERVAL_MS = 5000;
const CUSTOM_DESIGN_MAX_FETCH_COUNT = 120;
const PRIVACY_STORAGE_KEY = `${homeAiReplicaConfig.appId}:privacy-accepted`;
const ONBOARDING_STORAGE_KEY = `${homeAiReplicaConfig.appId}:onboarding-complete`;
const GUIDE_STORAGE_KEY = `${homeAiReplicaConfig.appId}:guide-complete`;
const BUSINESS_TARGET_STORAGE_KEY = `${homeAiReplicaConfig.appId}:business-targets`;
const REPLICA_ENVIRONMENTS = ['local', 'test', 'production'] as const satisfies readonly ReplicaEnvironment[];
const BUSINESS_TARGET_LABELS: Record<ReplicaEnvironment, string> = {
  local: '本地环境',
  test: '测试环境',
  production: '线上环境',
};
const BUSINESS_TARGET_INPUT_LABELS: Record<ReplicaEnvironment, string> = {
  local: '本地环境访问地址',
  test: '测试环境访问地址',
  production: '线上环境访问地址',
};
const DEFAULT_BUSINESS_TARGETS: Record<ReplicaEnvironment, string> = {
  local: 'http://127.0.0.1:8090',
  test: 'https://pixel-studio.ttt.wanmeixiangsu.cn',
  production: 'https://pixel-studio.wanmeixiangsu.cn',
};

function normalizeBusinessTargetValue(value: string) {
  const text = value.trim();
  if (!text) {
    return '';
  }
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function loadBusinessTargets() {
  const nextTargets: Record<ReplicaEnvironment, string> = { ...DEFAULT_BUSINESS_TARGETS };
  try {
    const payload = JSON.parse(localStorage.getItem(BUSINESS_TARGET_STORAGE_KEY) ?? '{}') as Partial<Record<ReplicaEnvironment, unknown>>;
    for (const key of REPLICA_ENVIRONMENTS) {
      const normalized = typeof payload[key] === 'string' ? normalizeBusinessTargetValue(payload[key] ?? '') : '';
      nextTargets[key] = normalized || DEFAULT_BUSINESS_TARGETS[key];
    }
  } catch {
    // 本地存储损坏时继续使用默认地址，避免设置弹窗无法打开。
  }
  return nextTargets;
}

function formatBusinessTargetHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

const resetParams = new URLSearchParams(window.location.search);
if (resetParams.get('__homeai_reset') === '1') {
  // 本地复刻对比时需要反复回到首启态；该参数只清理本应用的本地演示状态。
  localStorage.removeItem(PRIVACY_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(GUIDE_STORAGE_KEY);
  resetParams.delete('__homeai_reset');
  const nextSearch = resetParams.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
}
const smsAuthClient = createSmsAuthClient(homeAiReplicaConfig);
const session = createReplicaSession(homeAiReplicaConfig.appId);
const initialBusinessTargets = loadBusinessTargets();
const activeTab = ref<MainTab>('home');
const mineTab = ref<'works' | 'assistant'>('works');
const environment = ref<ReplicaEnvironment>(session.environment);
const authTokenDraft = ref(session.authToken);
const businessTargets = ref<Record<ReplicaEnvironment, string>>({ ...initialBusinessTargets });
const businessTargetDrafts = ref<Record<ReplicaEnvironment, string>>({ ...initialBusinessTargets });
const snapshot = ref<HomeAiSnapshot>(structuredClone(appShellSnapshot));
const apiState = ref<HomeAiApiState>({
  mode: 'live',
  environmentLabel: environment.value,
  lastError: '',
});
const apiDebugPage = ref(window.location.hash === API_DEBUG_HASH);
const switchingEnvironment = ref(false);
const settingsDialogVisible = ref(false);
const toastMessage = ref('');
const toastKind = ref<'notice' | 'error'>('notice');
const vipPurchaseSource = ref<'manual' | 'assistantQuota' | 'assistantRoundLimit' | 'customDesign'>('manual');
const vipPurchaseLoading = ref(false);
const vipPurchaseStatusText = ref('');
const isScrolled = ref(false);
const privacyVisible = ref(localStorage.getItem(PRIVACY_STORAGE_KEY) !== '1');
const onboardingVisible = ref(localStorage.getItem(ONBOARDING_STORAGE_KEY) !== '1');
const guideVisible = ref(localStorage.getItem(GUIDE_STORAGE_KEY) !== '1' && !privacyVisible.value && !onboardingVisible.value);
const guideStep = ref(0);
const onboardingStep = ref<'role' | 'source'>('role');
const selectedRole = ref('');
const selectedSource = ref('');
const selectedFeatureCode = ref('interior');
const designStep = ref(0);
const selectedImageName = ref('');
const selectedStyle = ref('现代简约');
const activeDiscoverCategory = ref('全部');
const assistantInput = ref('');
const assistantImageUrls = ref<string[]>([]);
const assistantUploadingImage = ref(false);
const assistantMessages = ref<AssistantUiMessage[]>([]);
const assistantSessionKey = ref('');
const assistantSending = ref(false);
const assistantMessageScroller = ref<HTMLElement | null>(null);
const assistantFileInputElement = ref<HTMLInputElement | null>(null);
const assistantAttachmentMenuVisible = ref(false);
const assistantFileCapture = ref(false);
const assistantEntryAutoSending = ref(false);
const assistantWorkContext = ref<CustomDesignPageContext | null>(null);
const assistantSceneType = ref<'ASSISTANT_CHAT' | 'CUSTOM_DESIGN'>('ASSISTANT_CHAT');
const selectedWork = ref<WorkItem | null>(null);
const workDetailPresetPrompt = ref('');
const workList = ref<WorkItem[]>([]);
const workListLoading = ref(false);
const workListError = ref('');
const assistantHistorySessions = ref<AssistantHistorySession[]>([]);
const assistantHistoryLoading = ref(false);
const assistantHistoryError = ref('');
const selectedGenerationDetail = ref<HomeAiGenerationDetail | null>(null);
const workDetailLoading = ref(false);
const workDetailError = ref('');
const customDesignContext = ref<CustomDesignPageContext | null>(null);
const customDesignImages = ref<CustomDesignImageEntry[]>([]);
const customDesignImageIndex = ref(0);
const customDesignInput = ref('');
const customDesignStatus = ref<CustomDesignStatus>('idle');
const customDesignLastPrompt = ref('');
const customStylePanelVisible = ref(false);
const customDesignProcessRecords = ref<CustomDesignProcessRecord[]>([]);
const customDesignRecordsLoading = ref(false);
const customDesignApplyingCode = ref('');
const customDesignDraftReferenceImageUrl = ref('');
let customDesignPollingTimer: number | null = null;
let assistantHistoryLoadVersion = 0;

const designSteps = ['upload', 'style', 'result'] as const;
const styles = ['现代简约', '奶油风', '新中式', '原木风', '轻奢', '工业风'];
const roles = [
  { label: '我是业主', subtitle: 'Owner', image: homeAiAssets.surveyOwner },
  { label: '我是设计师', subtitle: 'Design', image: homeAiAssets.surveyDesigner },
  { label: '我先看看', subtitle: 'Take A Look', image: homeAiAssets.surveyCurios },
];
const sourceOptions = [
  { label: '设计师/装修公司推荐', icon: '荐', color: '#a9adff' },
  { label: '小红书', icon: '红', color: '#ff2442' },
  { label: '抖音', icon: '抖', color: '#171b20' },
  { label: '微信视频号', icon: '微', color: '#19c465' },
  { label: '应用商店搜索', icon: '搜', color: '#3aa7f4' },
  { label: '问的 AI，如豆包/千问/文心一言等', icon: 'AI', color: '#e9edf5' },
];
const guideSlides = [
  {
    title: '开启设计之旅',
    subtitle: '上传任意房间照片，AI 即刻智能识别空间',
    ...homeAiAssets.guideVideos[0],
  },
  {
    title: '定义你的风格',
    subtitle: '海量风格模板随心换，轻松找到你的理想型',
    ...homeAiAssets.guideVideos[1],
  },
  {
    title: '打造极致细节',
    subtitle: '自由调整风格配色，一键改善生活细节',
    ...homeAiAssets.guideVideos[2],
  },
  {
    title: '见证家的蜕变',
    subtitle: '高清效果图秒生成，装修效果提前预见',
    ...homeAiAssets.guideVideos[3],
  },
];
const designTools = [
  { label: '涂抹', icon: homeAiAssets.paint },
  { label: '换色', icon: homeAiAssets.color },
  { label: '材质', icon: homeAiAssets.texture },
  { label: '擦除', icon: homeAiAssets.erase },
];
const customDesignStyles = [
  { code: 'cream', name: '奶油风', image: homeAiAssets.guide.interiorGood },
  { code: 'modern', name: '现代简约', image: homeAiAssets.guide.renovationGood },
  { code: 'wood', name: '原木风', image: homeAiAssets.guide.gardenGood },
  { code: 'luxury', name: '轻奢', image: homeAiAssets.guide.exteriorGood },
];
const customDesignPromptExamples = ['保留布局，改成奶油风', '让客厅更显大', '换成原木色软装'];
const assistantQuickQuestions = ['小户型客厅怎么显大？', '现代简约适合什么配色？', '帮我规划玄关收纳', '预算有限先改哪里？'];
const ADVANCED_CHAT_CURRENT_USER_ID = 'homeai-user';
const ADVANCED_CHAT_ASSISTANT_USER_ID = 'homeai-assistant';
const ASSISTANT_IMAGE_ACCEPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ASSISTANT_IMAGE_MAX_SIZE = 20 * 1024 * 1024;
const ASSISTANT_IMAGE_MAX_COUNT = 1;
const ASSISTANT_IMAGE_LIMIT_TEXT = '一次最多上传 1 张图片';
const settingRows: ReplicaSettingsRow[] = [
  { key: 'profile', label: '编辑资料', icon: 'profile' },
  { key: 'feedback', label: '意见反馈', icon: 'feedback' },
];

const environmentOptions = computed(() => [
  {
    key: 'local' as const,
    label: BUSINESS_TARGET_LABELS.local,
    host: formatBusinessTargetHost(businessTargets.value.local),
  },
  {
    key: 'test' as const,
    label: BUSINESS_TARGET_LABELS.test,
    host: formatBusinessTargetHost(businessTargets.value.test),
  },
  {
    key: 'production' as const,
    label: BUSINESS_TARGET_LABELS.production,
    host: formatBusinessTargetHost(businessTargets.value.production),
  },
]);
const businessTargetRows = computed(() => environmentOptions.value.map((option) => ({ key: option.key, inputLabel: BUSINESS_TARGET_INPUT_LABELS[option.key] })));
const normalizedBusinessTarget = computed(
  () => normalizeBusinessTargetValue(businessTargets.value[environment.value]) || DEFAULT_BUSINESS_TARGETS[environment.value],
);

const tabs = computed(() => [
  { key: 'home' as const, label: '首页', icon: activeTab.value === 'home' ? homeAiAssets.tabs.home[1] : homeAiAssets.tabs.home[0] },
  { key: 'design' as const, label: '设计', icon: activeTab.value === 'design' ? homeAiAssets.tabs.design[1] : homeAiAssets.tabs.design[0] },
  { key: 'assistant' as const, label: '设计助手', icon: homeAiAssets.magicWand },
  {
    key: 'discover' as const,
    label: '发现',
    icon: activeTab.value === 'discover' ? homeAiAssets.tabs.discover[1] : homeAiAssets.tabs.discover[0],
  },
  { key: 'mine' as const, label: '我的', icon: activeTab.value === 'mine' ? homeAiAssets.tabs.mine[1] : homeAiAssets.tabs.mine[0] },
]);

const selectedFeature = computed<DesignFeature>(
  () => snapshot.value.features.find((feature) => feature.code === selectedFeatureCode.value) ?? snapshot.value.features[0],
);
const homeCards = computed(() =>
  // 首页入口复用各功能的装修参考图，避免误用 APK 中其他功能域的演示素材。
  snapshot.value.features.map((feature) => ({
    ...feature,
    image: feature.guideImage,
  })),
);
const bootFlowVisible = computed(() => privacyVisible.value || onboardingVisible.value || guideVisible.value);
const activeGuide = computed(() => guideSlides[guideStep.value] ?? guideSlides[0]);
const currentStep = computed(() => designSteps[designStep.value]);
const discoverCategories = computed(() => ['全部', ...Array.from(new Set(snapshot.value.discover.map((item) => item.tag)))]);
const filteredDiscover = computed(() => {
  if (activeDiscoverCategory.value === '全部') {
    return snapshot.value.discover;
  }
  return snapshot.value.discover.filter((item) => item.tag === activeDiscoverCategory.value);
});
const displayWorks = computed(() => (workList.value.length > 0 ? workList.value : snapshot.value.works));
const assistantHistoryGroups = computed(() => {
  const groups = new Map<string, AssistantHistorySession[]>();
  for (const session of assistantHistorySessions.value) {
    const label = formatAssistantHistoryGroupLabel(session);
    groups.set(label, [...(groups.get(label) ?? []), session]);
  }
  return Array.from(groups.entries()).map(([label, sessions]) => ({ label, sessions }));
});
const selectedGenerationWorks = computed(() => {
  if (!selectedWork.value) {
    return [];
  }
  const recordId = selectedWork.value.recordId || selectedWork.value.id;
  if (selectedGenerationDetail.value?.recordId === recordId && selectedGenerationDetail.value.works.length > 0) {
    return selectedGenerationDetail.value.works;
  }
  const works = displayWorks.value.filter((work) => (work.recordId || work.id) === recordId);
  return works.length > 0 ? works : [selectedWork.value];
});
const workDetailCustomDesignDisabled = computed(() => {
  if (workDetailLoading.value || !selectedWork.value || selectedWork.value.sourceType !== 'work') {
    return true;
  }
  const recordId = selectedWork.value.recordId || selectedWork.value.id;
  return (
    selectedGenerationDetail.value?.recordId !== recordId ||
    !selectedGenerationDetail.value.works.some((work) => work.id === selectedWork.value?.id && work.sourceType === 'work')
  );
});
const selectedGenerationWorkIndexText = computed(() => {
  if (!selectedWork.value) {
    return '-';
  }
  const index = selectedGenerationWorks.value.findIndex((work) => work.id === selectedWork.value?.id);
  return index >= 0 ? `第 ${index + 1} 张` : '当前图';
});
const isHomeAiVipMember = computed(() => snapshot.value.user.vipActive);
const settingsUserIdText = computed(() => {
  const userId = snapshot.value.user.userId.trim();
  return userId && userId !== '-' ? userId : '未登录';
});
const settingsUserIdCopyable = computed(() => settingsUserIdText.value !== '未登录');
const profileUserHint = computed(() => {
  if (!authTokenDraft.value.trim()) {
    return '登录后可查看真实作品';
  }
  return snapshot.value.user.vipLabel === '未登录' ? '账号信息同步中' : '账号已认证';
});
const vipPurchaseTitle = computed(() => {
  if (vipPurchaseSource.value === 'assistantRoundLimit') {
    return '超过免费体验轮数';
  }
  if (vipPurchaseSource.value === 'assistantQuota') {
    return '会员权益已达免费上限';
  }
  if (vipPurchaseSource.value === 'customDesign') {
    return '开通会员使用定制设计';
  }
  return '开通会员解锁更多权益';
});
const vipPurchaseDescription = computed(() => {
  if (vipPurchaseSource.value === 'assistantRoundLimit') {
    return '当前 AI 设计助手会话已达到后台配置的免费对话轮数，开通会员后可继续提问。';
  }
  if (vipPurchaseSource.value === 'assistantQuota') {
    return '免费权益已用完，开通会员后可继续创建和使用 AI 设计助手。';
  }
  if (vipPurchaseSource.value === 'customDesign') {
    return '作品定制设计属于会员能力，开通后可基于当前作品继续修改和生成方案。';
  }
  return '解锁更多 AI 装修设计能力，持续优化你的家装方案。';
});
const vipPurchaseBackLabel = computed(() => (vipPurchaseSource.value === 'customDesign' ? '返回作品详情' : '返回 AI 助手'));
const assistantPageTitle = computed(() => (assistantSceneType.value === 'CUSTOM_DESIGN' ? '定制设计' : 'AI 设计师'));
const assistantEmptyTitle = computed(() => (assistantSceneType.value === 'CUSTOM_DESIGN' ? '定制设计' : '设计助手'));
const assistantEmptyDescription = computed(() =>
  assistantSceneType.value === 'CUSTOM_DESIGN'
    ? '会基于当前作品开启独立定制设计会话，不复用普通 AI 问询上下文。'
    : '可以咨询户型、风格、预算和软装搭配，也可以上传图片作为参考。',
);
const assistantInputPlaceholder = computed(() =>
  assistantSceneType.value === 'CUSTOM_DESIGN' ? '输入你的定制设计需求' : '输入你的装修问题',
);
const assistantComposerDisabled = computed(() =>
  assistantUploadingImage.value ||
  shouldDisableAssistantComposer({
    assistantSending: assistantSending.value,
    messages: assistantMessages.value,
  }),
);
const assistantComposerPlaceholder = computed(() =>
  assistantUploadingImage.value ? '图片上传中，请稍候' : assistantComposerDisabled.value ? '正在回复中，请稍候' : assistantInputPlaceholder.value,
);
const assistantSendDisabled = computed(() => assistantComposerDisabled.value || (!assistantInput.value.trim() && assistantImageUrls.value.length === 0));
const assistantUserAvatar = computed(() => snapshot.value.user.avatar || homeAiAssets.appLogo);
const advancedChatMessages = computed<AdvancedChatMessage[]>(() => assistantMessages.value.map(mapAssistantMessageToAdvancedChatMessage));
const currentCustomDesignImage = computed(() => customDesignImages.value[customDesignImageIndex.value] ?? customDesignImages.value[0] ?? null);
const customDesignBusy = computed(() => customDesignStatus.value === 'processing');
const customDesignSubmitDisabled = computed(() => customDesignBusy.value || !customDesignInput.value.trim() || customDesignImages.value.length === 0);
const customPromptExamplesVisible = computed(() => customDesignStatus.value !== 'processing' && customDesignImages.value.length > 0);
const visibleCustomDesignProcessRecords = computed(() => {
  const context = customDesignContext.value;
  if (!context?.recordId || !context.workId) {
    return [];
  }
  // 过程记录属于具体 generationRecord 下的某个 work，避免在作品详情里看到其它作品的修改记录。
  return customDesignProcessRecords.value.filter(
    (record) => record.generationRecordId === context.recordId && record.sourceWorkId === context.workId,
  );
});
const customDesignChatRecords = computed(() => [...visibleCustomDesignProcessRecords.value].reverse());
const completedCustomDesignRecordCount = computed(
  () => visibleCustomDesignProcessRecords.value.filter((record) => record.status === 'completed' || record.status === 'applied').length,
);
const pendingCustomDesignRecordCount = computed(
  () => visibleCustomDesignProcessRecords.value.filter((record) => record.status === 'submitted' || record.status === 'processing').length,
);
const customDesignRecordsSubtitle = computed(() => {
  if (!customDesignContext.value) {
    return '当前没有选中的作品';
  }
  return '只看当前作品的修改记录';
});

function formatShortCode(value?: string | null) {
  const text = String(value || '').trim();
  if (!text) {
    return '-';
  }
  // 页面只展示首尾短码，真实 ID 仍保留在接口上下文里，避免长串业务字段撑破 APP 布局。
  return text.length > 16 ? `${text.slice(0, 8)}...${text.slice(-5)}` : text;
}

function formatWorkStatusText(status?: string | null) {
  const normalized = String(status || '').trim().toUpperCase();
  const statusMap: Record<string, string> = {
    PENDING: '排队中',
    PROCESSING: '生成中',
    RUNNING: '生成中',
    FINISHED: '已完成',
    SUCCEEDED: '已完成',
    SUCCESS: '已完成',
    FAILED: '生成失败',
    EXPIRED: '已过期',
  };
  return statusMap[normalized] ?? String(status || '已生成');
}

function formatDisplayTime(value?: string | null) {
  const text = String(value || '').trim();
  if (!text) {
    return '今天';
  }
  const numericValue = Number(text);
  const date = !Number.isNaN(numericValue) && /^\d{10,13}$/.test(text)
    ? new Date(text.length === 10 ? numericValue * 1000 : numericValue)
    : new Date(text.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatWorkDisplayMeta(work: WorkItem) {
  return `${formatWorkStatusText(work.status)} · ${formatDisplayTime(work.createdAt)}`;
}

function resolveAssistantSessionTime(session: AssistantHistorySession | DesignAssistantSessionItem) {
  const lastUserMessageTime = 'lastUserMessageTime' in session ? session.lastUserMessageTime : null;
  return Math.max(parseAssistantSessionTime(lastUserMessageTime), parseAssistantSessionTime(session.updateTime), parseAssistantSessionTime(session.createTime));
}

function compactAssistantHistoryText(value?: string | null, maxLength = 42) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatAssistantHistoryTitle(session: AssistantHistorySession) {
  const firstUserText = compactAssistantHistoryText(session.firstUserText, 28);
  if (firstUserText) {
    return firstUserText;
  }
  const summary = String(session.summary || '').trim();
  if (summary) {
    return compactAssistantHistoryText(summary.split('\n')[0], 28) || '设计助手会话';
  }
  return session.sceneType === 'CUSTOM_DESIGN' ? '定制设计会话' : '设计助手会话';
}

function formatAssistantHistorySubtitle(session: AssistantHistorySession) {
  const lastPreviewText = compactAssistantHistoryText(session.lastPreviewText, 42);
  if (lastPreviewText) {
    return lastPreviewText;
  }
  const summary = compactAssistantHistoryText(session.summary, 42);
  if (summary) {
    return summary;
  }
  if (session.status) {
    return `查看助手对话 · ${session.status}`;
  }
  return session.sceneType === 'CUSTOM_DESIGN' ? '查看定制设计对话' : '查看助手对话';
}

function formatAssistantHistoryTime(session: AssistantHistorySession) {
  const timestamp = parseAssistantSessionTime(session.lastUserMessageTime) || resolveAssistantSessionTime(session);
  if (!timestamp) {
    return '最近';
  }
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  if (isSameDay(date, today)) {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }
  if (isSameDay(date, yesterday)) {
    return '昨天';
  }
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date);
}

function formatAssistantHistoryGroupLabel(session: AssistantHistorySession) {
  const timestamp = resolveAssistantSessionTime(session);
  if (!timestamp) {
    return '历史记录';
  }
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  if (isSameDay(date, today)) {
    return '今天';
  }
  if (isSameDay(date, yesterday) || today.getTime() - timestamp < 7 * 24 * 60 * 60 * 1000) {
    return '近7天';
  }
  return '历史记录';
}

function persistEnvironment() {
  persistReplicaEnvironment(homeAiReplicaConfig.appId, environment.value);
}

function persistBusinessTargets() {
  const nextTargets: Record<ReplicaEnvironment, string> = { ...DEFAULT_BUSINESS_TARGETS };
  for (const key of REPLICA_ENVIRONMENTS) {
    const normalized = normalizeBusinessTargetValue(businessTargetDrafts.value[key]);
    if (!normalized) {
      showToast(`${BUSINESS_TARGET_LABELS[key]}访问地址格式不正确`);
      return;
    }
    nextTargets[key] = normalized;
  }
  businessTargets.value = nextTargets;
  localStorage.setItem(BUSINESS_TARGET_STORAGE_KEY, JSON.stringify(nextTargets));
  // 只记录 host 维度，避免把用户可能误填的路径参数写入日志。
  console.info(
    '[HomeAI 设置] 更新业务访问地址',
    Object.fromEntries(REPLICA_ENVIRONMENTS.map((key) => [key, formatBusinessTargetHost(nextTargets[key])])),
  );
  showToast('访问地址已保存');
  void reload();
}

function restoreDefaultBusinessTargets() {
  businessTargets.value = { ...DEFAULT_BUSINESS_TARGETS };
  businessTargetDrafts.value = { ...DEFAULT_BUSINESS_TARGETS };
  localStorage.removeItem(BUSINESS_TARGET_STORAGE_KEY);
  console.info('[HomeAI 设置] 恢复默认业务访问地址');
  showToast('已恢复默认访问地址');
  void reload();
}

function saveToken() {
  persistReplicaAuthToken(homeAiReplicaConfig.appId, authTokenDraft.value);
}

async function restoreLocalAuthToken() {
  if (authTokenDraft.value.trim()) {
    void persistHomeAiLocalAuthToken(authTokenDraft.value);
    return;
  }
  const token = await loadHomeAiLocalAuthToken();
  if (!token) {
    return;
  }
  authTokenDraft.value = token;
  saveToken();
}

function updateApiState(lastError = '') {
  apiState.value = {
    mode: 'live',
    environmentLabel: environment.value,
    lastError,
  };
}

function syncApiDebugPage() {
  apiDebugPage.value = window.location.hash === API_DEBUG_HASH;
}

function showToast(message: string) {
  toastMessage.value = message;
  toastKind.value = message.includes('失败') || message.includes('错误') ? 'error' : 'notice';
  window.setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = '';
    }
  }, 2600);
}

async function copySettingsUserId() {
  if (!settingsUserIdCopyable.value) {
    showToast('当前未获取到 User ID');
    return;
  }
  try {
    await navigator.clipboard.writeText(settingsUserIdText.value);
    showToast('User ID 已复制');
  } catch {
    showToast('复制失败，请手动选择 User ID');
  }
}

function openVipPurchasePage(source: 'manual' | 'assistantQuota' | 'assistantRoundLimit' | 'customDesign' = 'manual') {
  vipPurchaseSource.value = source;
  vipPurchaseStatusText.value = '';
  toastMessage.value = '';
  activeTab.value = 'vipPurchase';
}

function returnFromVipPurchase() {
  if (vipPurchaseSource.value === 'customDesign') {
    activeTab.value = selectedWork.value ? 'workDetail' : 'mine';
    return;
  }
  activeTab.value = vipPurchaseSource.value === 'manual' ? 'mine' : 'assistant';
}

async function loadVipPurchaseChannel() {
  if (vipPurchaseLoading.value) {
    return;
  }
  if (!requireAssistantLogin()) {
    return;
  }
  vipPurchaseLoading.value = true;
  vipPurchaseStatusText.value = '正在加载会员方案...';
  try {
    const channel = await requestBusiness<{ channelCode?: string }>(homeAiReplicaConfig.endpoints.goodsChannelCode, getAssistantContext(), {
      params: { entrance: 'vip' },
    });
    const channelCode = channel.channelCode?.trim();
    vipPurchaseStatusText.value = channelCode ? '会员方案已准备，请在原 APP 内完成支付' : '会员方案暂未返回，请稍后再试';
    // 购买页只记录渠道是否可用，不把完整售卖配置或用户 token 写入日志。
    console.info('[HomeAI VIP] 会员售卖渠道加载完成', { hasChannelCode: Boolean(channelCode) });
  } catch (error) {
    vipPurchaseStatusText.value = error instanceof Error ? error.message : '会员方案加载失败，请稍后再试';
    console.warn('[HomeAI VIP] 会员售卖渠道加载失败', { message: vipPurchaseStatusText.value });
  } finally {
    vipPurchaseLoading.value = false;
  }
}

function getAssistantLimitMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || '');
}

function isAssistantRoundLimitError(error: unknown) {
  const message = getAssistantLimitMessage(error);
  return /(轮次|轮数|对话.*上限|超过.*轮|超过.*次数|次数.*(上限|不足|用完)|免费.*(轮|次))/i.test(message);
}

function isAssistantQuotaLimitError(error: unknown) {
  const message = getAssistantLimitMessage(error);
  return (
    isAssistantRoundLimitError(error) ||
    (/(只能创建一个|创建.*上限|会话.*上限|VIP|会员|免费用户|权益)/i.test(message) && /(助手|会话|创建|绘画|轮|次|使用)/.test(message))
  );
}

function handleAssistantQuotaLimitError(error: unknown) {
  if (!isAssistantQuotaLimitError(error)) {
    return false;
  }
  const source = isAssistantRoundLimitError(error) ? 'assistantRoundLimit' : 'assistantQuota';
  openVipPurchasePage(source);
  // 额度命中属于业务引导，不再用错误 toast 打断用户，日志仅记录原因分类。
  console.info('[HomeAI Assistant] 助手额度限制跳转会员购买页', { source });
  return true;
}

function updateAuthToken(token: string) {
  authTokenDraft.value = token.trim();
  saveToken();
  void persistHomeAiLocalAuthToken(token);
}

async function sendLoginSmsCode(phoneNumber: string) {
  return smsAuthClient.sendCode(phoneNumber);
}

async function loginWithSmsCode(payload: ReplicaLoginPayload) {
  const userInfo = await smsAuthClient.login(payload.phoneNumber, payload.smsCode, payload.smsId);
  updateAuthToken(userInfo.authToken ?? '');
  await reload();
}

async function clearLogin() {
  updateAuthToken('');
  await reload();
}

async function chooseEnvironment(nextEnvironment: ReplicaEnvironment) {
  if (nextEnvironment === environment.value || switchingEnvironment.value) {
    return;
  }

  environment.value = nextEnvironment;
  switchingEnvironment.value = true;
  try {
    await reload();
    showToast(`已切换到${environmentOptions.value.find((option) => option.key === nextEnvironment)?.label ?? nextEnvironment}`);
  } finally {
    switchingEnvironment.value = false;
  }
}

function handleSettingRow(row: ReplicaSettingsRow) {
  if (row.key === 'profile') {
    showToast('编辑资料入口已保留，后续接入真实业务接口');
    return;
  }
  if (row.key === 'feedback') {
    showToast('反馈入口已保留，后续接入真实业务接口');
    return;
  }
  showToast(`${row.label} 暂未接入`);
}

function chooseRole(role: string) {
  showToast(`已选择：${role}`);
}

function acceptPrivacy() {
  // 隐私弹窗只模拟原 APP 首次启动链路，确认态保存在本地，避免重复打扰。
  localStorage.setItem(PRIVACY_STORAGE_KEY, '1');
  privacyVisible.value = false;
  onboardingVisible.value = localStorage.getItem(ONBOARDING_STORAGE_KEY) !== '1';
  guideVisible.value = !onboardingVisible.value && localStorage.getItem(GUIDE_STORAGE_KEY) !== '1';
}

function selectOnboardingRole(role: string) {
  selectedRole.value = role;
  onboardingStep.value = 'source';
}

function completeOnboarding() {
  // 首屏问卷只影响演示流入口，不把身份或来源写入业务接口，避免产生无意义用户数据。
  localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
  onboardingVisible.value = false;
  if (localStorage.getItem(GUIDE_STORAGE_KEY) !== '1') {
    guideVisible.value = true;
    guideStep.value = 0;
    return;
  }
  showToast(selectedRole.value ? `已记录：${selectedRole.value}` : '已进入首页');
}

function finishOnboardingStep() {
  if (onboardingStep.value === 'role') {
    onboardingStep.value = 'source';
    return;
  }

  if (!selectedSource.value) {
    showToast('请选择一个来源，或点击上一步返回');
    return;
  }
  completeOnboarding();
}

function nextGuide() {
  if (guideStep.value < guideSlides.length - 1) {
    guideStep.value += 1;
    return;
  }
  localStorage.setItem(GUIDE_STORAGE_KEY, '1');
  guideVisible.value = false;
  showToast(selectedRole.value ? `已记录：${selectedRole.value}` : '已进入首页');
}

function selectFeature(code: string) {
  selectedFeatureCode.value = code;
  designStep.value = 0;
  activeTab.value = 'design';
}

function resetDesign() {
  designStep.value = 0;
  selectedImageName.value = '';
}

function switchTab(tab: MainTab) {
  if (tab === 'assistant') {
    openAssistantHome();
    return;
  }
  activeTab.value = tab;
}

function openAssistantHome() {
  if (!requireAssistantLogin()) {
    return;
  }
  if (assistantSceneType.value !== 'ASSISTANT_CHAT') {
    // 底部 AI 入口固定进入 AI 设计助手，避免沿用定制设计会话去发送普通咨询。
    assistantSceneType.value = 'ASSISTANT_CHAT';
    assistantWorkContext.value = null;
    assistantSessionKey.value = '';
    assistantMessages.value = [];
  }
  activeTab.value = 'assistant';
}

function chooseMineTab(nextTab: 'works' | 'assistant') {
  mineTab.value = nextTab;
  if (nextTab === 'assistant') {
    void loadAssistantHistory();
  }
}

function selectDesignInputImage() {
  // 这里只记录用户选择的本地输入态，不生成任何业务作品；作品必须来自真实 generation 接口。
  selectedImageName.value = `${selectedFeature.value.title}.jpg`;
}

function selectGenerationWork(work: WorkItem) {
  selectedWork.value = work;
}

function openWorkDetail(work: WorkItem, presetPrompt = '') {
  const currentRecordId = selectedGenerationDetail.value?.recordId;
  const nextRecordId = work.recordId || work.id;
  selectedWork.value = work;
  workDetailPresetPrompt.value = presetPrompt;
  workDetailError.value = '';
  if (currentRecordId !== nextRecordId) {
    selectedGenerationDetail.value = null;
  }
  activeTab.value = 'workDetail';
  void loadSelectedWorkDetail(work);
}

async function refreshWorkList() {
  if (!authTokenDraft.value) {
    workList.value = [];
    snapshot.value = { ...snapshot.value, works: [] };
    workListError.value = '登录后可刷新真实作品列表';
    return;
  }
  workListLoading.value = true;
  workListError.value = '';
  try {
    workList.value = await listHomeAiWorks(getAssistantContext(), 1, 20);
    // 作品列表是用户进入详情的起点，这里同步 snapshot 以便其它入口继续复用最新作品。
    snapshot.value = {
      ...snapshot.value,
      works: workList.value,
    };
    console.info('[HomeAI Work] 作品列表刷新完成', { count: workList.value.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : '作品列表加载失败';
    workListError.value = message;
    console.warn('[HomeAI Work] 作品列表刷新失败', { message });
  } finally {
    workListLoading.value = false;
  }
}

function resolveAssistantMessageTextValue(message: DesignAssistantMessage) {
  return resolveAssistantText(message.messageContent).trim();
}

function findFirstUserText(messages: DesignAssistantMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'USER' && resolveAssistantMessageTextValue(message));
  return firstUserMessage ? resolveAssistantMessageTextValue(firstUserMessage) : '';
}

function findLastPreviewText(messages: DesignAssistantMessage[]) {
  return [...messages]
    .reverse()
    .map((message) => resolveAssistantMessageTextValue(message))
    .find(Boolean) ?? '';
}

function findLastUserMessageTime(messages: DesignAssistantMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'USER' && message.messageTime)?.messageTime ?? null;
}

async function buildAssistantHistorySession(session: DesignAssistantSessionItem) {
  try {
    const messages = await listDesignAssistantMessages(getAssistantContext(), session.sessionKey);
    return {
      ...session,
      firstUserText: findFirstUserText(messages),
      lastPreviewText: findLastPreviewText(messages),
      lastUserMessageTime: findLastUserMessageTime(messages),
    } satisfies AssistantHistorySession;
  } catch (error) {
    const message = error instanceof Error ? error.message : '会话消息加载失败';
    // 单条会话消息失败时保留列表入口，避免一个异常导致我的页助手 tab 整体不可用。
    console.warn('[HomeAI Assistant] 助手会话消息摘要加载失败', { message });
    return {
      ...session,
      firstUserText: '',
      lastPreviewText: '',
      lastUserMessageTime: null,
      summaryLoaded: true,
    } satisfies AssistantHistorySession;
  }
}

function createAssistantHistoryPlaceholder(session: DesignAssistantSessionItem) {
  return {
    ...session,
    firstUserText: '',
    lastPreviewText: '',
    lastUserMessageTime: null,
    summaryLoaded: false,
  } satisfies AssistantHistorySession;
}

function replaceAssistantHistorySession(nextSession: AssistantHistorySession) {
  assistantHistorySessions.value = assistantHistorySessions.value
    .map((session) => (session.sessionKey === nextSession.sessionKey ? nextSession : session))
    .filter((session) => !session.summaryLoaded || hasAssistantHistoryContent(session))
    .sort((left, right) => resolveAssistantSessionTime(right) - resolveAssistantSessionTime(left));
}

async function enrichAssistantHistorySession(session: DesignAssistantSessionItem, loadVersion: number) {
  const nextSession = await buildAssistantHistorySession(session);
  if (loadVersion !== assistantHistoryLoadVersion) {
    return;
  }
  replaceAssistantHistorySession({ ...nextSession, summaryLoaded: true });
}

function hasAssistantHistoryContent(session: AssistantHistorySession) {
  return Boolean(
    compactAssistantHistoryText(session.firstUserText) ||
      compactAssistantHistoryText(session.lastPreviewText) ||
      compactAssistantHistoryText(session.summary),
  );
}

async function loadAssistantHistory() {
  const loadVersion = ++assistantHistoryLoadVersion;
  if (!authTokenDraft.value) {
    assistantHistorySessions.value = [];
    assistantHistoryError.value = '登录后可查看助手会话';
    return;
  }
  assistantHistoryLoading.value = true;
  assistantHistoryError.value = '';
  try {
    const sessions = await listDesignAssistantSessions(getAssistantContext(), 'ASSISTANT_CHAT');
    const validSessions = sessions.filter((session) => session.sessionKey);
    // 会话列表首屏只依赖 sessions 接口；每条消息摘要后台补齐，避免 N+1 消息请求阻塞“我的-助手”列表。
    assistantHistorySessions.value = validSessions
      .map(createAssistantHistoryPlaceholder)
      .sort((left, right) => resolveAssistantSessionTime(right) - resolveAssistantSessionTime(left));
    console.info('[HomeAI Assistant] 助手会话列表加载完成', {
      count: assistantHistorySessions.value.length,
      pendingSummaryCount: validSessions.length,
    });
    validSessions.forEach((session) => {
      void enrichAssistantHistorySession(session, loadVersion);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '助手会话加载失败';
    assistantHistoryError.value = message;
    console.warn('[HomeAI Assistant] 助手会话列表加载失败', { message });
  } finally {
    assistantHistoryLoading.value = false;
  }
}

async function openAssistantHistorySession(session: AssistantHistorySession) {
  if (!session.sessionKey || !requireAssistantLogin()) {
    return;
  }
  assistantSending.value = true;
  try {
    assistantSceneType.value = 'ASSISTANT_CHAT';
    assistantWorkContext.value = null;
    assistantSessionKey.value = session.sessionKey;
    const messages = await listDesignAssistantMessages(getAssistantContext(), session.sessionKey);
    assistantMessages.value = messages;
    assistantImageUrls.value = [];
    assistantInput.value = '';
    activeTab.value = 'assistant';
    console.info('[HomeAI Assistant] 从我的页进入助手历史会话', {
      messageCount: messages.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '打开助手会话失败';
    showToast(message);
    console.warn('[HomeAI Assistant] 打开助手历史会话失败', { message });
  } finally {
    assistantSending.value = false;
  }
}

async function loadSelectedWorkDetail(work: WorkItem) {
  if (!authTokenDraft.value) {
    workDetailError.value = '登录后可查询真实作品详情';
    return;
  }
  const recordCode = work.recordId || work.id;
  if (!recordCode) {
    workDetailError.value = '当前作品信息不完整，无法查询详情';
    return;
  }
  workDetailLoading.value = true;
  workDetailError.value = '';
  try {
    const detail = await getHomeAiGenerationDetail(getAssistantContext(), recordCode, work);
    const activeWork = selectedWork.value;
    if (!activeWork || (activeWork.recordId || activeWork.id) !== recordCode) {
      return;
    }
    selectedGenerationDetail.value = detail;
    const preferredWorkId = activeWork.id === work.id ? work.id : activeWork.id;
    const matchedWork = detail.works.find((item) => item.id === preferredWorkId) ?? detail.works[0] ?? work;
    selectedWork.value = matchedWork;
    console.info('[HomeAI Work] 作品详情加载完成', { recordCode, workCount: detail.works.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : '作品详情加载失败';
    workDetailError.value = message;
    console.warn('[HomeAI Work] 作品详情加载失败', { recordCode, message });
  } finally {
    workDetailLoading.value = false;
  }
}

function refreshSelectedWorkDetail() {
  if (!selectedWork.value) {
    return;
  }
  void loadSelectedWorkDetail(selectedWork.value);
}

function openCustomDesignFromSelectedWork() {
  if (!selectedWork.value) {
    showToast('请先选择一个真实作品');
    return;
  }
  if (workDetailCustomDesignDisabled.value) {
    showToast(workDetailLoading.value ? '作品详情加载中，请稍后再试' : '请先选择真实作品');
    return;
  }
  if (!isHomeAiVipMember.value) {
    openVipPurchasePage('customDesign');
    console.info('[HomeAI CustomDesign] 非会员从作品详情进入定制设计，跳转会员购买页');
    return;
  }
  const work = selectedWork.value;
  enterCustomDesignPage(
    {
      workId: work.id,
      recordId: work.recordId || work.id,
      templateCode: work.templateId,
      imageUrl: work.coverUrl,
      workTitle: work.title,
    },
    workDetailPresetPrompt.value,
  );
  workDetailPresetPrompt.value = '';
}

function generateCustomDesignId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCustomDesignRecordTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function formatCustomDesignRemoteRecordTime(value: CustomDesignRecordItemResponse['createTime']) {
  if (!value) {
    return formatCustomDesignRecordTime();
  }
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);
}

function normalizeCustomDesignRecordStatus(status: string): CustomDesignProcessStatus {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPLIED') {
    return 'applied';
  }
  if (normalized === 'SUCCEEDED') {
    return 'completed';
  }
  if (normalized === 'FAILED') {
    return 'failed';
  }
  if (normalized === 'WAITING_USER_INPUT') {
    return 'waitingUserInput';
  }
  if (normalized === 'RUNNING' || normalized === 'PROCESSING') {
    return 'processing';
  }
  if (normalized === 'SUBMITTED') {
    return 'submitted';
  }
  return 'submitted';
}

function mapRemoteCustomDesignRecord(record: CustomDesignRecordItemResponse): CustomDesignProcessRecord {
  const outputImageUrl = resolveCustomDesignRecordOutputImageUrl(record);
  return {
    recordKey: record.customDesignCode,
    processRecordCode: record.customDesignCode,
    generationRecordId: record.generationRecordId,
    sourceWorkId: record.sourceWorkId,
    prompt: record.prompt || '',
    templateCode: record.templateCode || customDesignContext.value?.templateCode || '-',
    status: normalizeCustomDesignRecordStatus(record.status),
    inputImageUrl: resolveCustomDesignRecordInputImageUrl(record),
    assistantText: record.assistantText || '',
    outputImageUrl,
    createdAt: formatCustomDesignRemoteRecordTime(record.createTime),
  };
}

function isPendingCustomDesignRecord(record: CustomDesignProcessRecord) {
  return record.status === 'submitted' || record.status === 'processing';
}

function findLatestPendingCustomDesignRecordForCurrentContext() {
  const context = customDesignContext.value;
  if (!context?.recordId || !context.workId) {
    return null;
  }
  return customDesignProcessRecords.value.find(
    (record) =>
      record.generationRecordId === context.recordId &&
      record.sourceWorkId === context.workId &&
      isPendingCustomDesignRecord(record) &&
      record.processRecordCode &&
      record.processRecordCode !== '提交中',
  ) ?? null;
}

function resumeCustomDesignPollingFromLatestRunningRecord() {
  if (activeTab.value !== 'customDesign' || customDesignPollingTimer) {
    return;
  }
  const pendingRecord = findLatestPendingCustomDesignRecordForCurrentContext();
  if (!pendingRecord) {
    return;
  }
  // 页面重新进入时，如果最后一条记录仍在服务端运行中，需要恢复 fetch 轮询。
  customDesignStatus.value = 'processing';
  scheduleCustomDesignFetch(pendingRecord.recordKey, pendingRecord.processRecordCode, 0);
  console.info('[HomeAI CustomDesign] 恢复定制设计轮询', {
    customDesignCode: pendingRecord.processRecordCode,
    status: pendingRecord.status,
  });
}

async function loadCustomDesignProcessRecords() {
  const context = customDesignContext.value;
  if (!context?.recordId || !context.workId || !authTokenDraft.value.trim()) {
    return;
  }
  customDesignRecordsLoading.value = true;
  try {
    const response = await listHomeAiCustomDesignRecords(getAssistantContext(), {
      generationRecordId: context.recordId,
      sourceWorkId: context.workId,
      limit: 100,
    });
    const remoteRecords = (response.records ?? []).map(mapRemoteCustomDesignRecord);
    const remoteRecordCodes = new Set(remoteRecords.map((record) => record.processRecordCode));
    const localPendingRecords = customDesignProcessRecords.value.filter(
      (record) =>
        record.generationRecordId === context.recordId &&
        record.sourceWorkId === context.workId &&
        (record.status === 'submitted' || record.status === 'processing') &&
        !remoteRecordCodes.has(record.processRecordCode),
    );
    const otherContextRecords = customDesignProcessRecords.value.filter(
      (record) => record.generationRecordId !== context.recordId || record.sourceWorkId !== context.workId,
    );
    // 过程记录以业务服务落库结果为准，仅保留本轮刚提交且服务端列表还没刷出的本地占位。
    customDesignProcessRecords.value = [...localPendingRecords, ...remoteRecords, ...otherContextRecords];
    resumeCustomDesignPollingFromLatestRunningRecord();
  } catch (error) {
    const message = error instanceof Error ? error.message : '过程记录加载失败';
    showToast(message);
    console.warn('[HomeAI CustomDesign] 定制设计过程记录加载失败', {
      recordId: context.recordId,
      workId: context.workId,
      message,
    });
  } finally {
    customDesignRecordsLoading.value = false;
  }
}

function enterCustomDesignPage(context: Omit<CustomDesignPageContext, 'batchNo'>, presetPrompt = '') {
  clearCustomDesignPollingTimer();
  // 定制设计不复用 IM 会话；页面进入时生成独立 batchNo，后续真实接口按该批次提交和轮询。
  const pageContext: CustomDesignPageContext = {
    ...context,
    batchNo: generateCustomDesignId('custom-design-batch'),
    templateCode: context.templateCode || context.templateId || selectedFeature.value.code || 'homeai_custom_design_default',
  };
  customDesignContext.value = pageContext;
  customDesignImages.value = [
    {
      localId: generateCustomDesignId('custom-design-source'),
      imageUrl: pageContext.imageUrl,
      isOriginal: true,
    },
  ];
  customDesignImageIndex.value = 0;
  customDesignInput.value = presetPrompt;
  customDesignDraftReferenceImageUrl.value = '';
  customDesignLastPrompt.value = '';
  customDesignStatus.value = 'idle';
  customStylePanelVisible.value = false;
  activeTab.value = 'customDesign';
  void loadCustomDesignProcessRecords();
  console.info('[HomeAI CustomDesign] 进入独立定制设计页', {
    workId: pageContext.workId || '',
    recordId: pageContext.recordId || '',
    templateCode: pageContext.templateCode || '',
    hasImage: Boolean(pageContext.imageUrl),
  });
}

function clearCustomDesignPollingTimer() {
  if (customDesignPollingTimer) {
    window.clearTimeout(customDesignPollingTimer);
    customDesignPollingTimer = null;
  }
}

function updateCustomDesignProcessRecord(recordKey: string, patch: Partial<CustomDesignProcessRecord>) {
  customDesignProcessRecords.value = customDesignProcessRecords.value.map((record) =>
    record.recordKey === recordKey ? { ...record, ...patch } : record,
  );
}

async function submitCustomDesignInstruction(prompt: string, options: { referenceImageUrl?: string } = {}) {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt || customDesignBusy.value) {
    return;
  }
  if (!requireAssistantLogin()) {
    return;
  }
  if (!currentCustomDesignImage.value) {
    showToast('请先选择一个作品，再进入定制设计');
    return;
  }
  const context = customDesignContext.value;
  if (!context?.recordId || !context.workId) {
    showToast('当前作品信息不完整，暂时不能定制设计');
    return;
  }
  const recordKey = generateCustomDesignId('custom-design-process');
  const referenceImageUrl = (options.referenceImageUrl || customDesignDraftReferenceImageUrl.value || '').trim();
  const isFirstContextRecord = visibleCustomDesignProcessRecords.value.length === 0;
  const inputImageUrl = referenceImageUrl || (isFirstContextRecord ? currentCustomDesignImage.value.imageUrl : '');
  const templateCode = context.templateCode || 'homeai_custom_design_default';
  const generationRecordId = context.recordId;
  const sourceWorkId = context.workId;
  customDesignInput.value = '';
  customDesignDraftReferenceImageUrl.value = '';
  customDesignLastPrompt.value = normalizedPrompt;
  customDesignStatus.value = 'processing';
  customStylePanelVisible.value = false;
  clearCustomDesignPollingTimer();
  customDesignProcessRecords.value = [
    {
      recordKey,
      processRecordCode: '提交中',
      generationRecordId,
      sourceWorkId,
      prompt: normalizedPrompt,
      templateCode,
      status: 'submitted',
      inputImageUrl,
      createdAt: formatCustomDesignRecordTime(),
    },
    ...customDesignProcessRecords.value,
  ];

  try {
    const submitResponse = await submitHomeAiCustomDesign(getAssistantContext(), {
      generationRecordId,
      sourceWorkId,
      templateCode,
      prompt: normalizedPrompt,
      ...(referenceImageUrl ? { referenceImageUrl } : {}),
    });
    updateCustomDesignProcessRecord(recordKey, {
      processRecordCode: submitResponse.customDesignCode,
    });
    console.info('[HomeAI CustomDesign] 定制设计已提交', {
      customDesignCode: submitResponse.customDesignCode,
      generationRecordId,
      sourceWorkId,
      templateCode,
      status: submitResponse.status,
      hasReferenceImage: Boolean(referenceImageUrl),
    });
    scheduleCustomDesignFetch(recordKey, submitResponse.customDesignCode, 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : '定制设计提交失败';
    updateCustomDesignProcessRecord(recordKey, { status: 'failed' });
    customDesignStatus.value = 'failed';
    showToast(message);
    console.warn('[HomeAI CustomDesign] 定制设计提交失败', { generationRecordId, sourceWorkId, templateCode, message });
  }
}

function scheduleCustomDesignFetch(recordKey: string, customDesignCode: string, fetchCount: number) {
  clearCustomDesignPollingTimer();
  // 定制设计生成耗时较长，固定 5 秒轮询一次，避免客户端和业务服务之间请求过密。
  customDesignPollingTimer = window.setTimeout(() => {
    customDesignPollingTimer = null;
    void fetchCustomDesignResult(recordKey, customDesignCode, fetchCount);
  }, CUSTOM_DESIGN_FETCH_INTERVAL_MS);
}

async function fetchCustomDesignResult(recordKey: string, customDesignCode: string, fetchCount: number) {
  if (fetchCount >= CUSTOM_DESIGN_MAX_FETCH_COUNT) {
    updateCustomDesignProcessRecord(recordKey, { status: 'failed' });
    customDesignStatus.value = 'failed';
    showToast('定制设计生成超时，请稍后查看记录');
    return;
  }
  try {
    const response = await fetchHomeAiCustomDesign(getAssistantContext(), customDesignCode);
    const status = String(response.status || '').toUpperCase();
    console.info('[HomeAI CustomDesign] 定制设计轮询结果', {
      customDesignCode,
      status,
      fetchCount,
    });
    if (status === 'FAILED') {
      updateCustomDesignProcessRecord(recordKey, { status: 'failed' });
      customDesignStatus.value = 'failed';
      showToast(response.errorMessage || '定制设计生成失败');
      return;
    }
    if (status === 'WAITING_USER_INPUT') {
      updateCustomDesignProcessRecord(recordKey, {
        status: 'waitingUserInput',
        assistantText: response.assistantText || '我还需要你补充一下具体想调整的方向。',
      });
      customDesignStatus.value = 'idle';
      void loadCustomDesignProcessRecords();
      return;
    }
    if (status !== 'SUCCEEDED' && status !== 'APPLIED') {
      scheduleCustomDesignFetch(recordKey, customDesignCode, fetchCount + 1);
      return;
    }
    const outputImageUrl = resolveCustomDesignOutputImageUrl(response);
    if (!outputImageUrl) {
      throw new Error('定制设计结果图片为空');
    }
    const outputImageLocalId = generateCustomDesignId('custom-design-output');
    customDesignImages.value = [
      ...customDesignImages.value,
      {
        localId: outputImageLocalId,
        imageUrl: outputImageUrl,
        customDesignCode,
        isOriginal: false,
      },
    ];
    customDesignImageIndex.value = customDesignImages.value.length - 1;
    updateCustomDesignProcessRecord(recordKey, {
      status: 'completed',
      outputImageUrl,
      outputImageLocalId,
    });
    customDesignStatus.value = 'completed';
    void loadCustomDesignProcessRecords();
  } catch (error) {
    const message = error instanceof Error ? error.message : '定制设计轮询失败';
    updateCustomDesignProcessRecord(recordKey, { status: 'failed' });
    customDesignStatus.value = 'failed';
    showToast(message);
    console.warn('[HomeAI CustomDesign] 定制设计轮询失败', { customDesignCode, message });
  }
}

function submitCustomDesignText() {
  void submitCustomDesignInstruction(customDesignInput.value);
}

function useCustomDesignPromptExample(prompt: string) {
  // 示例只帮用户快速填入意图，真正提交仍由用户点击发送，避免误触发生成任务。
  customDesignInput.value = prompt;
}

function submitCustomDesignStyle(style: { code: string; name: string }) {
  void submitCustomDesignInstruction(`改成${style.name}，保留原有空间结构`);
}

function clearCustomDesignDraftReferenceImage() {
  customDesignDraftReferenceImageUrl.value = '';
}

function markCustomDesignFeedback(record: CustomDesignProcessRecord, feedback: 'satisfied' | 'unsatisfied') {
  updateCustomDesignProcessRecord(record.recordKey, { feedback });
  showToast(feedback === 'satisfied' ? '已记录：满意' : '已记录：不满意');
}

function regenerateCustomDesignFromRecord(record: CustomDesignProcessRecord) {
  const referenceImageUrl = record.outputImageUrl || record.inputImageUrl || customDesignContext.value?.imageUrl || '';
  if (!referenceImageUrl) {
    showToast('当前没有可参考的设计图');
    return;
  }
  void submitCustomDesignInstruction('请基于当前图片重新生成一版设计效果，保持原有空间关系和用户需求方向。', {
    referenceImageUrl,
  });
}

function startModifyCustomDesignFromRecord(record: CustomDesignProcessRecord) {
  if (!record.outputImageUrl) {
    showToast('当前没有可修改的结果图');
    return;
  }
  customDesignDraftReferenceImageUrl.value = record.outputImageUrl;
  customDesignInput.value = '';
  activeTab.value = 'customDesign';
  showToast('已带入当前图片，请输入修改要求');
}

function closeCustomDesignPage() {
  clearCustomDesignPollingTimer();
  customDesignDraftReferenceImageUrl.value = '';
  customDesignStatus.value = 'idle';
  activeTab.value = selectedWork.value ? 'workDetail' : 'mine';
}

function resetCustomDesignPage() {
  const source = customDesignImages.value.find((image) => image.isOriginal) ?? customDesignImages.value[0];
  if (!source) {
    return;
  }
  clearCustomDesignPollingTimer();
  customDesignImages.value = [source];
  customDesignImageIndex.value = 0;
  customDesignInput.value = '';
  customDesignDraftReferenceImageUrl.value = '';
  customDesignLastPrompt.value = '';
  customDesignStatus.value = 'idle';
  customStylePanelVisible.value = false;
}

function handleCustomDesignImageError() {
  showToast('图片加载失败，请稍后重试');
}

function customDesignRecordStatusText(status: CustomDesignProcessStatus) {
  if (status === 'submitted') {
    return '已提交';
  }
  if (status === 'applied') {
    return '已应用';
  }
  if (status === 'completed') {
    return '已完成';
  }
  if (status === 'failed') {
    return '失败';
  }
  if (status === 'waitingUserInput') {
    return '等待补充';
  }
  return '生成中';
}

function customDesignRecordChatTitle(record: CustomDesignProcessRecord) {
  if (record.status === 'applied') {
    return '这张设计已应用';
  }
  if (record.status === 'completed') {
    return '设计已生成';
  }
  if (record.status === 'failed') {
    return '这次没有生成成功';
  }
  if (record.status === 'waitingUserInput') {
    return '需要补充信息';
  }
  return '正在生成新的设计';
}

function customDesignRecordApplyButtonText(record: CustomDesignProcessRecord) {
  if (record.status === 'applied') {
    return '已应用';
  }
  return customDesignApplyingCode.value === record.processRecordCode ? '应用中' : '应用设计';
}

function customDesignOutputPlaceholderText(record: CustomDesignProcessRecord) {
  if (record.status === 'failed') {
    return '生成失败';
  }
  return '暂无输出';
}

function showCustomDesignRecordResult(record: CustomDesignProcessRecord) {
  if (!record.outputImageLocalId && !record.outputImageUrl) {
    return;
  }
  if (!record.outputImageLocalId && record.outputImageUrl) {
    const existingIndex = customDesignImages.value.findIndex((image) => image.imageUrl === record.outputImageUrl);
    if (existingIndex >= 0) {
      customDesignImageIndex.value = existingIndex;
      activeTab.value = 'customDesign';
      return;
    }
    const outputImageLocalId = generateCustomDesignId('custom-design-output');
    customDesignImages.value = [
      ...customDesignImages.value,
      {
        localId: outputImageLocalId,
        imageUrl: record.outputImageUrl,
        customDesignCode: record.processRecordCode,
        isOriginal: false,
      },
    ];
    updateCustomDesignProcessRecord(record.recordKey, { outputImageLocalId });
    customDesignImageIndex.value = customDesignImages.value.length - 1;
    activeTab.value = 'customDesign';
    return;
  }
  const targetIndex = customDesignImages.value.findIndex((image) => image.localId === record.outputImageLocalId);
  if (targetIndex >= 0) {
    customDesignImageIndex.value = targetIndex;
  }
  activeTab.value = 'customDesign';
}

function continueCustomDesignFromRecord(record: CustomDesignProcessRecord) {
  customDesignInput.value = record.prompt;
  if (record.outputImageUrl && !record.outputImageLocalId) {
    showCustomDesignRecordResult(record);
    customDesignInput.value = record.prompt;
    return;
  }
  const targetIndex = customDesignImages.value.findIndex((image) => image.localId === record.outputImageLocalId);
  if (targetIndex >= 0) {
    customDesignImageIndex.value = targetIndex;
  }
  activeTab.value = 'customDesign';
}

function patchAppliedWorkCover(sourceWorkId: string, outputImageUrl: string) {
  if (!sourceWorkId || !outputImageUrl) {
    return;
  }
  const replaceCover = (work: WorkItem) => (work.id === sourceWorkId ? { ...work, coverUrl: outputImageUrl } : work);
  if (selectedWork.value?.id === sourceWorkId) {
    selectedWork.value = replaceCover(selectedWork.value);
  }
  workList.value = workList.value.map(replaceCover);
  snapshot.value = {
    ...snapshot.value,
    works: snapshot.value.works.map(replaceCover),
  };
  if (selectedGenerationDetail.value) {
    selectedGenerationDetail.value = {
      ...selectedGenerationDetail.value,
      works: selectedGenerationDetail.value.works.map(replaceCover),
    };
  }
}

async function applyCustomDesignResult(customDesignCode: string, outputImageUrl = '') {
  if (!customDesignCode || customDesignApplyingCode.value) {
    return;
  }
  if (!requireAssistantLogin()) {
    return;
  }
  const processRecord = customDesignProcessRecords.value.find((record) => record.processRecordCode === customDesignCode);
  if (processRecord && processRecord.status !== 'completed') {
    showToast(processRecord.status === 'applied' ? '这张设计已经应用过了' : '只能应用已完成的定制设计');
    return;
  }
  customDesignApplyingCode.value = customDesignCode;
  try {
    const response = await applyHomeAiCustomDesign(getAssistantContext(), customDesignCode);
    const sourceWorkId = response.sourceWorkId || processRecord?.sourceWorkId || customDesignContext.value?.workId || '';
    const appliedImageUrl =
      outputImageUrl ||
      processRecord?.outputImageUrl ||
      customDesignImages.value.find((image) => image.customDesignCode === customDesignCode)?.imageUrl ||
      '';
    // 服务端应用策略是替换入口 generationWork；前端先同步当前内存态，再刷新真实作品详情。
    patchAppliedWorkCover(sourceWorkId, appliedImageUrl);
    updateCustomDesignProcessRecord(processRecord?.recordKey || customDesignCode, {
      status: 'applied',
      appliedAt: formatCustomDesignRecordTime(),
    });
    if (selectedWork.value) {
      void loadSelectedWorkDetail(selectedWork.value);
    }
    void refreshWorkList();
    void loadCustomDesignProcessRecords();
    showToast('应用设计成功');
    console.info('[HomeAI CustomDesign] 定制设计已应用', {
      customDesignCode,
      sourceWorkId,
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '应用设计失败';
    showToast(message);
    console.warn('[HomeAI CustomDesign] 定制设计应用失败', { customDesignCode, message });
  } finally {
    customDesignApplyingCode.value = '';
  }
}

function applyCustomDesignRecordResult(record: CustomDesignProcessRecord) {
  if (record.status === 'applied') {
    showToast('这张设计已经应用过了');
    return;
  }
  void applyCustomDesignResult(record.processRecordCode, record.outputImageUrl || '');
}

function createLocalAssistantMessage(role: 'USER' | 'ASSISTANT', text: string, imageUrl = '') {
  const messageContent = imageUrl
    ? { type: 'IMAGE', image: { large: imageUrl } }
    : { type: 'TEXT', text: { text } };
  return {
    localId: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    status: 'SUCCEEDED',
    contentType: imageUrl ? 'IMAGE' : 'TEXT',
    messageContent,
    messageTime: Date.now(),
  } satisfies AssistantUiMessage & { localId: string };
}

function getAssistantContext() {
  return {
    authToken: authTokenDraft.value,
    environment: environment.value,
    businessTarget: normalizedBusinessTarget.value,
  };
}

function isLocalAssistantExperience() {
  return shouldUseLocalAssistantExperience({
    authToken: authTokenDraft.value,
  });
}

function requireAssistantLogin() {
  if (!shouldRequireAssistantLogin({ authToken: authTokenDraft.value })) {
    return true;
  }
  // 未获得登录态时打开独立登录弹窗，不把验证码登录控件铺到“我的”页面主体里。
  activeTab.value = 'mine';
  settingsDialogVisible.value = true;
  showToast('请先登录后使用 AI 设计助手');
  return false;
}

function formatAdvancedChatDate(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(timestamp));
}

function formatAdvancedChatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
}

function getAdvancedChatFileExtension(url: string) {
  const path = url.split('?')[0] || '';
  const extension = path.split('.').pop()?.toLowerCase() || 'jpg';
  return extension.length <= 5 ? extension : 'jpg';
}

function mapAssistantMessageToAdvancedChatMessage(message: AssistantUiMessage): AdvancedChatMessage {
  const timestamp = parseAssistantSessionTime(message.messageTime) || Date.now();
  const isUser = message.role === 'USER';
  const imageUrl = isUser ? resolveAssistantMessageImage(message) : '';
  const content = message.status === 'FAILED' ? sanitizeAssistantFailureMessage(message.errorMessage, message.errorCode) : resolveAssistantMessageText(message);
  const files = imageUrl
    ? [
        {
          name: '设计参考图',
          type: `image/${getAdvancedChatFileExtension(imageUrl)}`,
          extension: getAdvancedChatFileExtension(imageUrl),
          url: imageUrl,
          preview: imageUrl,
        },
      ]
    : undefined;
  return {
    _id: String(message.messageId || message.localId || `${message.role}-${timestamp}`),
    senderId: isUser ? ADVANCED_CHAT_CURRENT_USER_ID : ADVANCED_CHAT_ASSISTANT_USER_ID,
    content,
    username: isUser ? '我' : 'AI 装修大师',
    avatar: isUser ? assistantUserAvatar.value : homeAiAssets.magicWand,
    date: formatAdvancedChatDate(timestamp),
    timestamp: formatAdvancedChatTime(timestamp),
    saved: true,
    distributed: message.status !== 'PENDING',
    seen: message.status !== 'PENDING',
    failure: message.status === 'FAILED',
    disableActions: true,
    disableReactions: true,
    files,
  };
}

function resolveAssistantMessageText(message: DesignAssistantMessage) {
  return resolveAssistantText(message.messageContent);
}

function sanitizeAssistantFailureMessage(errorMessage?: string | null, errorCode?: string | null) {
  const rawMessage = String(errorMessage || '').trim();
  const rawCode = String(errorCode || '').trim().toUpperCase();
  // Agent、HTTP 状态码等属于后端调试信息，不能直接暴露在用户会话气泡里。
  if (/AGENT|HTTP|\b\d{3}\b/i.test(rawCode) || /Agent调用失败|HTTP|\b\d{3}\b/i.test(rawMessage)) {
    return '本次回复生成失败，请稍后重试或换个问题再试。';
  }
  return rawMessage || '本次回复生成失败，请稍后重试或换个问题再试。';
}

function resolveAssistantMessageImage(message: DesignAssistantMessage) {
  return resolveAssistantImageUrl(message.messageContent);
}

function useAssistantQuickQuestion(question: string) {
  if (assistantComposerDisabled.value) {
    return;
  }
  assistantInput.value = question;
}

function ensureAssistantAttachmentEnabled() {
  // 定制设计图片来自作品上下文，普通助手附件能力不能混入定制设计会话。
  if (assistantSceneType.value !== 'ASSISTANT_CHAT') {
    throw new Error('定制设计会话不支持上传附件');
  }
}

function validateAssistantImageFile(file: File) {
  ensureAssistantAttachmentEnabled();
  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = /\.(jpe?g|png|webp)$/.test(fileName);
  if ((file.type && !ASSISTANT_IMAGE_ACCEPT_TYPES.has(file.type)) || (!file.type && !hasAllowedExtension)) {
    throw new Error('请选择 JPG、PNG 或 WebP 图片');
  }
  if (file.size > ASSISTANT_IMAGE_MAX_SIZE) {
    throw new Error('图片不能超过 20MB');
  }
  if (assistantImageUrls.value.length >= ASSISTANT_IMAGE_MAX_COUNT) {
    throw new Error(ASSISTANT_IMAGE_LIMIT_TEXT);
  }
}

function scrollAssistantMessagesToBottom() {
  void nextTick(() => {
    const scroller = assistantMessageScroller.value;
    if (!scroller) {
      return;
    }
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  });
}

function toggleAssistantAttachmentMenu() {
  if (assistantComposerDisabled.value) {
    return;
  }
  try {
    ensureAssistantAttachmentEnabled();
    if (assistantImageUrls.value.length >= ASSISTANT_IMAGE_MAX_COUNT) {
      showToast(ASSISTANT_IMAGE_LIMIT_TEXT);
      return;
    }
    assistantAttachmentMenuVisible.value = !assistantAttachmentMenuVisible.value;
  } catch (error) {
    showToast(error instanceof Error ? error.message : '当前会话不支持上传附件');
  }
}

function openAssistantFilePicker(capture: boolean) {
  assistantFileCapture.value = capture;
  assistantAttachmentMenuVisible.value = false;
  void nextTick(() => {
    assistantFileInputElement.value?.click();
  });
}

function removeAssistantAttachment() {
  assistantImageUrls.value = [];
  assistantAttachmentMenuVisible.value = false;
}

async function uploadAssistantNativeFile(file: File) {
  validateAssistantImageFile(file);
  assistantUploadingImage.value = true;
  try {
    const imageUrl = await uploadHomeAiImage(getAssistantContext(), file);
    assistantImageUrls.value = [imageUrl];
    console.info('[HomeAI Assistant] 原生 IM 输入栏图片上传成功', { attachmentCount: 1 });
  } finally {
    assistantUploadingImage.value = false;
  }
}

function handleAssistantNativeFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {
    return;
  }
  void (async () => {
    try {
      await uploadAssistantNativeFile(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片上传失败';
      console.warn('[HomeAI Assistant] 原生 IM 输入栏图片上传失败', { message });
      showToast(message);
    }
  })();
}

function submitAssistantComposer() {
  if (assistantSendDisabled.value) {
    return;
  }
  assistantAttachmentMenuVisible.value = false;
  void sendAssistantMessage({ suppressBusyToast: true });
}

function openAssistantMessageImage(fileUrl: string) {
  if (!fileUrl) {
    showToast('图片加载失败，请稍后重试');
    return;
  }
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}

function createAssistantWaitingMessage(replyToMessageId?: string) {
  return {
    localId: `ASSISTANT-PENDING-${Date.now()}`,
    replyToMessageId,
    role: 'ASSISTANT',
    status: 'PENDING',
    contentType: 'TEXT',
    messageContent: { type: 'TEXT', text: { text: '正在回复中...' } },
    messageTime: Date.now(),
  } satisfies AssistantUiMessage & { localId: string };
}

function appendAssistantWaitingMessage(replyToMessageId?: string) {
  assistantMessages.value.push(createAssistantWaitingMessage(replyToMessageId));
}

function parseAssistantSessionTime(value?: string | number | null) {
  const text = String(value ?? '').trim();
  if (!text) {
    return 0;
  }
  const numericValue = Number(text);
  if (!Number.isNaN(numericValue) && /^\d{10,13}$/.test(text)) {
    return text.length === 10 ? numericValue * 1000 : numericValue;
  }
  const parsedTime = Date.parse(text.replace(' ', 'T'));
  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

function pickLatestAssistantSession(sessions: DesignAssistantSessionItem[]) {
  return (
    sessions
      .filter((session) => session.sessionKey)
      .sort((left, right) => {
        const leftTime = Math.max(parseAssistantSessionTime(left.updateTime), parseAssistantSessionTime(left.createTime));
        const rightTime = Math.max(parseAssistantSessionTime(right.updateTime), parseAssistantSessionTime(right.createTime));
        return rightTime - leftTime;
      })[0] ?? null
  );
}

function isAssistantSessionLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /(只能创建一个|创建.*上限|会话.*上限|VIP|会员)/i.test(message) && /(助手|会话|创建|绘画)/.test(message);
}

async function restoreLatestAssistantSession() {
  // 非 VIP 用户可能无法创建第二个 AI 助手会话，此时要回到已有会话，而不是让入口一直被额度提示挡住。
  const sessions = await listDesignAssistantSessions(getAssistantContext(), assistantSceneType.value);
  const session = pickLatestAssistantSession(sessions);
  if (!session) {
    return '';
  }
  assistantSessionKey.value = session.sessionKey;
  const messages = await listDesignAssistantMessages(getAssistantContext(), session.sessionKey);
  assistantMessages.value = messages;
  console.info('[HomeAI Assistant] 恢复已有设计助手会话', {
    sceneType: assistantSceneType.value,
    messageCount: messages.length,
  });
  return session.sessionKey;
}

async function ensureAssistantSession(startReason: 'APP_LAUNCH_FIRST_ENTER' | 'MANUAL_NEW' = 'APP_LAUNCH_FIRST_ENTER') {
  if (isLocalAssistantExperience() || !requireAssistantLogin()) {
    return '';
  }
  if (assistantSessionKey.value && startReason !== 'MANUAL_NEW') {
    return assistantSessionKey.value;
  }
  try {
    const response = await startDesignAssistantSession(getAssistantContext(), {
      sceneType: assistantSceneType.value,
      startReason: assistantSceneType.value === 'CUSTOM_DESIGN' ? 'WORK_RESULT_ENTER' : startReason,
      deviceId: `${homeAiReplicaConfig.appId}-h5`,
      lastWorkId: assistantSceneType.value === 'CUSTOM_DESIGN' ? assistantWorkContext.value?.workId : undefined,
      recordId: assistantSceneType.value === 'CUSTOM_DESIGN' ? assistantWorkContext.value?.recordId : undefined,
      templateId: assistantSceneType.value === 'CUSTOM_DESIGN' ? assistantWorkContext.value?.templateId : undefined,
      sourceImageUrl: assistantSceneType.value === 'CUSTOM_DESIGN' ? assistantWorkContext.value?.imageUrl : undefined,
    });
    assistantSessionKey.value = response.sessionKey;
    if (Array.isArray(response.messages) && response.messages.length > 0) {
      assistantMessages.value = response.messages;
    }
    return response.sessionKey;
  } catch (error) {
    // 自动进入时允许恢复已有会话；用户主动点“新会话”时仍保留服务端的创建限制提示。
    if (startReason !== 'MANUAL_NEW' && isAssistantSessionLimitError(error)) {
      try {
        const restoredSessionKey = await restoreLatestAssistantSession();
        if (restoredSessionKey) {
          showToast('已进入上次设计助手会话');
          return restoredSessionKey;
        }
      } catch (restoreError) {
        const message = restoreError instanceof Error ? restoreError.message : '恢复已有会话失败';
        console.warn('[HomeAI Assistant] 恢复已有设计助手会话失败', { message });
      }
    }
    throw error;
  }
}

async function restoreAssistantMessages() {
  if (isLocalAssistantExperience() || !assistantSessionKey.value || !requireAssistantLogin()) {
    return;
  }
  const messages = await listDesignAssistantMessages(getAssistantContext(), assistantSessionKey.value);
  assistantMessages.value = messages;
}

function hasAssistantReplyForMessage(messages: DesignAssistantMessage[], replyToMessageId: string, batchNo = '') {
  return Boolean(findAssistantCompletedReply(messages, { replyToMessageId, batchNo }));
}

function findAssistantReplyForMessage(messages: DesignAssistantMessage[], replyToMessageId: string, batchNo = '') {
  return findAssistantCompletedReply(messages, { replyToMessageId, batchNo }) as DesignAssistantMessage | undefined;
}

function renderAssistantMessagesWithPending(messages: DesignAssistantMessage[], replyToMessageId: string, batchNo = '') {
  if (!replyToMessageId || hasAssistantReplyForMessage(messages, replyToMessageId, batchNo)) {
    assistantMessages.value = messages;
    return;
  }
  assistantMessages.value = [...messages, createAssistantWaitingMessage(replyToMessageId)];
}

function waitAssistantPollInterval() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ASSISTANT_REPLY_POLL_INTERVAL_MS);
  });
}

async function pollAssistantReply(sessionKey: string, replyToMessageId: string, batchNo = '') {
  const startedAt = Date.now();
  while (Date.now() - startedAt < ASSISTANT_REPLY_POLL_TIMEOUT_MS) {
    const messages = await listDesignAssistantMessages(getAssistantContext(), sessionKey);
    const assistantReply = findAssistantReplyForMessage(messages, replyToMessageId, batchNo);
    if (assistantReply) {
      if (assistantReply.status === 'FAILED') {
        console.warn('[HomeAI Assistant] 后端 Agent 回复失败', {
          sessionKey,
          replyToMessageId,
          batchNo,
          errorCode: assistantReply.errorCode,
          errorMessage: assistantReply.errorMessage,
        });
      }
      assistantMessages.value = messages;
      return;
    }
    renderAssistantMessagesWithPending(messages, replyToMessageId, batchNo);
    await waitAssistantPollInterval();
  }
  throw new Error('AI 回复仍在处理中，请稍后刷新消息列表查看');
}

async function startManualAssistantSession() {
  if (isLocalAssistantExperience() || !requireAssistantLogin()) {
    return;
  }
  assistantSending.value = true;
  try {
    await ensureAssistantSession('MANUAL_NEW');
    assistantMessages.value = [];
    showToast('已新建设计助手会话');
  } catch (error) {
    if (handleAssistantQuotaLimitError(error)) {
      return;
    }
    showToast(error instanceof Error ? error.message : '新建会话失败');
  } finally {
    assistantSending.value = false;
  }
}

async function sendAssistantMessage(options: AssistantSendOptions = {}) {
  if (assistantComposerDisabled.value) {
    if (!options.suppressBusyToast) {
      showToast('正在回复中，请稍后再提问');
    }
    return false;
  }
  const prompt = (options.prompt ?? assistantInput.value).trim();
  const imageUrls = [...(options.imageUrls ?? assistantImageUrls.value)];
  const messageImageUrls = imageUrls;
  if (!prompt && messageImageUrls.length === 0) {
    return false;
  }
  if (isLocalAssistantExperience() || !requireAssistantLogin()) {
    return false;
  }
  const batchMessages = [
    ...messageImageUrls.map((imageUrl) => ({ contentType: 'IMAGE' as const, imageUrl })),
    ...(prompt ? [{ contentType: 'TEXT' as const, text: prompt }] : []),
  ];
  // 作品定制设计入口会自动提交默认 prompt，这里统一清空输入区，避免停留在“待发送”的中转态。
  assistantInput.value = '';
  assistantImageUrls.value = [];
  const localUserMessage = createLocalAssistantMessage('USER', prompt || '图片附件', messageImageUrls[0] || '');
  assistantMessages.value.push(localUserMessage);
  assistantSending.value = true;
  try {
    const sessionKey = await ensureAssistantSession();
    const response = await sendDesignAssistantMessage(getAssistantContext(), {
      // 发送阶段也要带上场景，避免后端异步 Agent 丢失普通助手/定制设计的路由上下文。
      sceneType: assistantSceneType.value,
      sessionKey,
      prompt,
      messages: batchMessages,
      imageUrls: messageImageUrls,
      workId: assistantWorkContext.value?.workId,
      recordId: assistantWorkContext.value?.recordId,
      templateId: assistantWorkContext.value?.templateId,
      sourceImageUrl: assistantWorkContext.value?.imageUrl,
      priceChecked: assistantSceneType.value === 'CUSTOM_DESIGN' ? true : undefined,
    });
    const replyToMessageId = response.messageId || response.userMessage?.messageId || '';
    if (!replyToMessageId) {
      await restoreAssistantMessages();
      return true;
    }
    renderAssistantMessagesWithPending(response.messages ?? [], replyToMessageId, response.batchNo || '');
    await pollAssistantReply(sessionKey, replyToMessageId, response.batchNo || '');
    return true;
  } catch (error) {
    assistantMessages.value = assistantMessages.value.filter((message) => message.status !== 'PENDING');
    if (handleAssistantQuotaLimitError(error)) {
      assistantMessages.value = assistantMessages.value.filter((message) => message.localId !== localUserMessage.localId);
      return false;
    }
    assistantMessages.value.push({
      localId: `ASSISTANT-FAILED-${Date.now()}`,
      role: 'ASSISTANT',
      status: 'FAILED',
      contentType: 'TEXT',
      messageContent: { type: 'TEXT', text: { text: '' } },
      errorMessage: sanitizeAssistantFailureMessage(error instanceof Error ? error.message : ''),
      messageTime: Date.now(),
    });
    const message = error instanceof Error ? error.message : '发送失败';
    console.warn('[HomeAI Assistant] 发送或轮询助手消息失败', { message });
    showToast(sanitizeAssistantFailureMessage(message));
    return false;
  } finally {
    assistantSending.value = false;
  }
}

function handleAssistantImageError() {
  showToast('图片加载失败，请稍后重试');
}

async function openCustomDesignFromResult(customPrompt?: string) {
  const workContext = resolveCustomDesignWorkContext();
  if (!workContext) {
    showToast('请先生成或选择一个作品，再进入定制设计');
    return false;
  }
  const matchingWork = displayWorks.value.find((work) => work.id === workContext.workId) ?? null;
  if (matchingWork) {
    openWorkDetail(matchingWork, customPrompt || '');
    return true;
  }
  selectedWork.value = {
    id: workContext.workId || 'current-work',
    recordId: workContext.recordId,
    templateId: workContext.templateId,
    title: '当前生成作品',
    status: '已生成',
    coverUrl: workContext.imageUrl,
    createdAt: '今天',
  };
  workDetailPresetPrompt.value = customPrompt || '';
  activeTab.value = 'workDetail';
  return true;
}

function resolveCustomDesignWorkContext() {
  const realWork = displayWorks.value.find((work) => work.id);
  if (!realWork) {
    return null;
  }
  return {
    workId: realWork.id,
    recordId: realWork.recordId,
    templateId: realWork.templateId || selectedFeature.value.code,
    imageUrl: realWork.coverUrl,
  };
}

function openCustomDesignFromFeedback() {
  openCustomDesignFromResult('我不满意当前效果，请帮我换一种更自然、更高级的设计');
}

function nextDesignStep() {
  if (designStep.value < designSteps.length - 1) {
    designStep.value += 1;
    return;
  }
  designStep.value = 0;
}

async function reload() {
  persistEnvironment();
  saveToken();
  updateApiState();

  try {
    snapshot.value = await loadHomeAiSnapshot({
      authToken: authTokenDraft.value,
      environment: environment.value,
      businessTarget: normalizedBusinessTarget.value,
    });
    workList.value = snapshot.value.works;
    workListError.value = '';
    updateApiState();
  } catch (error) {
    const maybeSnapshot = error && typeof error === 'object' && 'snapshot' in error ? (error as { snapshot?: HomeAiSnapshot }).snapshot : null;
    if (maybeSnapshot) {
      snapshot.value = maybeSnapshot;
      workList.value = maybeSnapshot.works;
    }
    apiState.value = {
      mode: 'live',
      environmentLabel: environment.value,
      lastError: error instanceof Error ? error.message : '接口请求失败，未使用本地兜底数据',
    };
  }
}

onMounted(() => {
  window.addEventListener('hashchange', syncApiDebugPage);
  window.addEventListener('popstate', syncApiDebugPage);
  syncApiDebugPage();
  void (async () => {
    await restoreLocalAuthToken();
    await reload();
  })();
});

watch(activeTab, (tab) => {
  if (tab !== 'assistant') {
    return;
  }
  if (assistantEntryAutoSending.value) {
    return;
  }
  void (async () => {
    try {
      await ensureAssistantSession();
      await restoreAssistantMessages();
    } catch (error) {
      if (handleAssistantQuotaLimitError(error)) {
        return;
      }
      const message = error instanceof Error ? error.message : '设计助手会话初始化失败';
      // 会话额度、会员限制等业务失败需要直接反馈给用户，否则后端 message 只会停留在控制台。
      showToast(message);
      console.warn('[HomeAI Assistant] AI 设计助手自动初始化失败', { message });
    }
  })();
});

watch([activeTab, assistantSessionKey, () => assistantMessages.value.length], scrollAssistantMessagesToBottom);

onUnmounted(() => {
  window.removeEventListener('hashchange', syncApiDebugPage);
  window.removeEventListener('popstate', syncApiDebugPage);
});
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  color: #192036;
  background: #dbe7f4;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
}

button {
  font: inherit;
  cursor: pointer;
}

button:focus-visible {
  outline: 0;
}

.app-frame {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 22px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.86), transparent 28%),
    linear-gradient(135deg, #f4f8fd 0%, #d7e5f2 48%, #eef3e6 100%);
}

.phone-shell {
  width: min(100%, 430px);
  height: min(900px, calc(100vh - 44px));
  min-height: 700px;
  display: grid;
  grid-template-rows: 30px 1fr 74px;
  overflow: hidden;
  border: 10px solid #111722;
  border-radius: 34px;
  background: #f6f8fb;
  box-shadow: 0 28px 60px rgba(31, 55, 83, 0.28);
}

.phone-shell.onboarding {
  grid-template-rows: 30px 1fr;
  background: #f2f5fa;
}

.phone-shell.guide {
  background: #000;
}

.phone-shell.immersive {
  grid-template-rows: 30px 1fr;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  color: #20283a;
  font-size: 12px;
  font-weight: 800;
  background: #f8fbff;
}

.phone-shell.onboarding .status-bar {
  color: #fff;
  background: #fff4be;
  mix-blend-mode: multiply;
}

.screen {
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: #f4f7fb;
}

.privacy-page {
  min-height: 0;
  position: relative;
  display: grid;
  align-items: end;
  padding: 24px 20px 54px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(243, 248, 255, 0.42), rgba(232, 238, 246, 0.92)),
    url("/assets/homeai/page_bg_home.png") center / cover no-repeat,
    #f3f6fb;
}

.privacy-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.56);
}

.launch-brand {
  position: absolute;
  left: 36px;
  right: 36px;
  bottom: 52px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #101725;
  opacity: 0.28;
}

.launch-brand img {
  width: 70px;
  height: 70px;
  border-radius: 18px;
}

.launch-brand span {
  display: grid;
  gap: 5px;
}

.launch-brand strong {
  font-size: 32px;
}

.launch-brand small {
  color: #4f5e72;
  font-size: 15px;
  font-weight: 800;
}

.privacy-dialog {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
  max-height: calc(100% - 24px);
  overflow-y: auto;
  padding: 26px 24px 22px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.privacy-dialog h1 {
  margin: 0;
  color: #2a2f38;
  font-size: 23px;
  text-align: center;
}

.privacy-dialog p {
  margin: 0;
  color: #646b76;
  font-size: 15px;
  line-height: 1.62;
}

.privacy-dialog a {
  color: #38afff;
  text-decoration: none;
}

.privacy-dialog footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.privacy-secondary,
.privacy-primary {
  min-height: 50px;
  border-radius: 26px;
  font-size: 18px;
  font-weight: 900;
}

.privacy-secondary {
  border: 1px solid #37aefb;
  color: #37aefb;
  background: #fff;
}

.privacy-primary {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #11d5d4, #0f8dff);
}

.onboarding-page {
  min-height: 0;
  position: relative;
  overflow-y: auto;
  padding: 0 20px 106px;
  background:
    linear-gradient(180deg, rgba(255, 240, 116, 0.68) 0%, rgba(255, 248, 206, 0.7) 29%, rgba(242, 245, 250, 0) 48%),
    url("/assets/homeai/source_survey_top_bg.png") top center / 100% auto no-repeat,
    #f2f5fa;
}

.onboarding-hero {
  display: grid;
  gap: 14px;
  padding: 64px 0 22px;
}

.onboarding-hero img {
  width: min(100%, 270px);
  height: auto;
}

.onboarding-hero strong {
  color: #101725;
  font-size: 24px;
  line-height: 1.42;
  letter-spacing: 0;
}

.onboarding-hero span {
  color: #536174;
  font-size: 14px;
  line-height: 1.45;
}

.text-button {
  position: absolute;
  top: 70px;
  left: 20px;
  z-index: 2;
  border: 0;
  color: #1b2638;
  background: transparent;
  font-weight: 850;
}

.text-button.skip {
  left: auto;
  right: 20px;
  font-size: 15px;
}

.role-question,
.source-question {
  display: grid;
  gap: 14px;
}

.role-card {
  min-height: 0;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 18px;
  color: #111722;
  background: #fff;
  text-align: left;
  box-shadow: 0 12px 26px rgba(55, 76, 104, 0.08);
}

.role-card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.role-card span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.role-card svg {
  display: none;
}

.source-question button {
  min-height: 86px;
  display: grid;
  grid-template-columns: 50px 1fr 30px;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 0;
  border-radius: 18px;
  color: #111722;
  background: #fff;
  text-align: left;
  box-shadow: 0 12px 24px rgba(55, 76, 104, 0.07);
}

.source-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: var(--source-bg);
  font-size: 17px;
  font-weight: 950;
}

.source-question button:last-child .source-icon {
  color: #233047;
}

.source-question strong {
  font-size: 20px;
  line-height: 1.35;
  font-weight: 700;
}

.radio-dot {
  width: 25px;
  height: 25px;
  border: 2px solid #d8dde5;
  border-radius: 50%;
}

.source-question button.active .radio-dot {
  border: 7px solid #fff500;
  outline: 2px solid #111722;
}

.onboarding-actions {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 22px;
  display: grid;
  grid-template-columns: 0.72fr 1.56fr;
  gap: 14px;
}

.secondary-button,
.next-button {
  min-height: 66px;
  border: 0;
  border-radius: 33px;
  color: #121212;
  font-size: 21px;
  font-weight: 900;
}

.secondary-button {
  background: #fff;
}

.next-button {
  background: #fff500;
}

.next-button:disabled {
  color: #272727;
  background: #cfcfcf;
}

.guide-page {
  min-height: 0;
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto 92px;
  overflow: hidden;
  background: #000;
}

.guide-visual {
  position: relative;
  isolation: isolate;
  min-height: 0;
  overflow: hidden;
}

.guide-poster {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-visual::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 46%;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.72) 72%, #000 100%);
}

.original-badge {
  position: absolute;
  top: 154px;
  right: 24px;
  z-index: 4;
  width: 84px;
  overflow: hidden;
  border: 3px solid #fff;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
}

.original-badge img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.original-badge strong {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 3px 0 4px;
  color: #fff;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.62));
  font-size: 18px;
  text-align: center;
}

.guide-copy {
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 0 24px 22px;
  color: #fff;
  text-align: center;
}

.guide-copy strong {
  font-size: 38px;
  line-height: 1.05;
}

.guide-copy span {
  font-size: 19px;
  font-weight: 900;
  line-height: 1.42;
}

.guide-next {
  align-self: start;
  min-height: 62px;
  margin: 0 20px;
  border: 0;
  border-radius: 31px;
  color: #161616;
  background: #fff500;
  font-size: 22px;
  font-weight: 900;
}

.page {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 18px 16px 24px;
}

.page-home {
  padding-top: 0;
  background: #edf5ff;
}

.native-home {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 12px 14px 96px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(237, 245, 255, 0.72) 42%, #f6f7fa 100%),
    url("/assets/homeai/page_bg_home.png") top center / cover no-repeat;
}

.home-native-head {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.member-pill {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 13px;
  border: 0;
  border-radius: 19px;
  color: #2f250c;
  background: rgba(255, 236, 153, 0.92);
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(144, 113, 34, 0.14);
}

.native-feature-list {
  display: grid;
  gap: 16px;
}

.native-feature-card {
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 24px;
  color: #111722;
  background: #fff;
  text-align: left;
  box-shadow: 0 16px 30px rgba(52, 76, 108, 0.12);
}

.native-feature-media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.32;
  background: #e7edf5;
}

.native-feature-media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.compare-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(24, 35, 56, 0.08);
}

.compare-line::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34px;
  height: 34px;
  transform: translate(-50%, -50%);
  border: 3px solid #fff;
  border-radius: 50%;
  background: rgba(17, 23, 34, 0.38);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

.native-feature-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 15px 16px;
}

.native-feature-card footer > span:first-child {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.native-feature-card strong {
  color: #121a2a;
  font-size: 20px;
  line-height: 1.2;
}

.native-feature-card small {
  overflow: hidden;
  color: #697688;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.try-button {
  flex: 0 0 auto;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  border-radius: 18px;
  color: #151515;
  background: #fff500;
  font-size: 13px;
  font-weight: 950;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 8px;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.sticky-top.solid {
  background: rgba(244, 248, 253, 0.92);
  box-shadow: 0 8px 20px rgba(46, 85, 126, 0.12);
  backdrop-filter: blur(14px);
}

.sticky-top > img {
  width: 88px;
  height: auto;
}

.sticky-top button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 10px 24px rgba(56, 93, 137, 0.14);
}

.sticky-top button img {
  width: 26px;
  height: 26px;
}

.hero-card {
  position: relative;
  min-height: 230px;
  overflow: hidden;
  border-radius: 22px;
  background: linear-gradient(135deg, #cbe5ff, #e5f8e9);
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.42;
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 68%;
  min-height: 230px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  padding: 24px 20px;
}

.hero-copy p,
.page-title-row p {
  margin: 0;
  color: #41607f;
  font-size: 13px;
  font-weight: 850;
}

.hero-copy h1 {
  margin: 0;
  color: #13243f;
  font-size: 34px;
  line-height: 1.04;
}

.primary-button,
.bottom-action {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 23px;
  color: #fff;
  background: linear-gradient(135deg, #235bff, #18b59b);
  font-weight: 900;
  box-shadow: 0 14px 24px rgba(35, 91, 255, 0.22);
}

.survey-strip,
.work-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.survey-strip header,
.work-list h3 {
  margin: 0;
}

.survey-strip header span,
.settings-shell small {
  color: #63748a;
  font-size: 12px;
  font-weight: 800;
}

.survey-strip header strong {
  display: block;
  margin-top: 4px;
  color: #14233d;
  font-size: 18px;
}

.survey-strip > div {
  display: grid;
  gap: 9px;
}

.survey-strip button {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 16px;
  color: #17304c;
  background: #fff;
  box-shadow: 0 12px 24px rgba(58, 89, 130, 0.1);
  overflow: hidden;
}

.survey-strip button img {
  display: block;
  width: 100%;
  height: auto;
}

.survey-strip button span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.feature-grid {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.feature-card {
  min-height: 146px;
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 0;
  border-radius: 20px;
  color: #17243a;
  background: #fff;
  box-shadow: 0 16px 26px rgba(50, 80, 120, 0.12);
  text-align: left;
}

.feature-cover {
  width: 112px;
  height: 122px;
  border-radius: 16px;
  object-fit: cover;
  background: #e6edf5;
}

.feature-copy {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.feature-copy strong {
  color: #111f35;
  font-size: 19px;
}

.feature-copy small,
.discover-card span,
.work-row span,
.result-preview span {
  color: #687a91;
  font-size: 13px;
  line-height: 1.45;
}

.feature-action {
  grid-column: 2;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 16px;
  color: #fff;
  background: var(--accent);
  font-size: 13px;
  font-weight: 900;
}

.feature-action img {
  width: 18px;
  height: 18px;
}

.page-design {
  padding-bottom: 86px;
  background: linear-gradient(180deg, #f7fbff, #eaf2fb);
}

.page-assistant {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  overflow: hidden;
  padding: 12px 18px 18px;
  background: #f5f8fd;
}

.page-work-detail {
  display: grid;
  grid-template-rows: auto auto auto auto minmax(0, 1fr);
  gap: 13px;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px 0;
  background: #f4f7fb;
}

.work-detail-header {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 44px;
}

.work-detail-header strong {
  color: #17243a;
  font-size: 18px;
  text-align: center;
}

.work-record-pill {
  min-height: 34px;
  border: 0;
  border-radius: 17px;
  padding: 0 12px;
  color: #2654bd;
  background: #eaf1ff;
  font-size: 12px;
  font-weight: 900;
}

.work-record-pill:disabled {
  color: #7d8da8;
  background: #eef2f7;
}

.work-detail-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  color: #9d2b2b;
  background: #fff0f0;
  font-size: 12px;
  line-height: 1.5;
}

.work-detail-hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  background: #10141c;
  box-shadow: 0 18px 34px rgba(39, 59, 87, 0.14);
}

.work-detail-hero > img {
  width: 100%;
  aspect-ratio: 1.03;
  display: block;
  object-fit: cover;
}

.work-detail-hero > div {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  gap: 5px;
  padding: 28px 16px 15px;
  color: #fff;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.72));
}

.work-detail-hero strong {
  font-size: 21px;
}

.work-detail-hero span {
  color: rgba(255, 255, 255, 0.76);
  font-size: 13px;
  font-weight: 800;
}

.work-detail-meta {
  display: grid;
  gap: 9px;
}

.work-detail-meta article {
  display: grid;
  gap: 5px;
  padding: 12px 13px;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(38, 61, 92, 0.07);
}

.work-detail-meta small {
  color: #7b879a;
  font-size: 12px;
  font-weight: 850;
}

.work-detail-meta strong {
  min-width: 0;
  overflow: hidden;
  color: #17243a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-group-section {
  display: grid;
  gap: 10px;
}

.work-group-section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.work-group-section h3 {
  margin: 0;
  color: #17243a;
  font-size: 16px;
}

.work-group-section header span {
  color: #7b879a;
  font-size: 12px;
  font-weight: 850;
}

.work-group-list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 108px;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.work-group-list button {
  min-width: 0;
  display: grid;
  gap: 7px;
  padding: 7px;
  border: 2px solid transparent;
  border-radius: 15px;
  color: #17243a;
  background: #fff;
  text-align: left;
}

.work-group-list button.active {
  border-color: #fff500;
  background: #fffde5;
}

.work-group-list img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  object-fit: cover;
}

.work-group-list span {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-detail-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  align-self: end;
  display: grid;
  gap: 10px;
  margin: 0 -16px;
  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(244, 247, 251, 0), #f4f7fb 22px, #f4f7fb);
}

.work-detail-actions button {
  min-height: 48px;
  border: 1px solid #d8e1ef;
  border-radius: 16px;
  color: #2654bd;
  background: #fff;
  font-weight: 900;
}

.work-detail-design-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 8px 18px rgba(38, 61, 92, 0.08);
}

.work-detail-design-button span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-detail-design-button svg {
  flex: 0 0 auto;
  color: #7d8da8;
}

.work-detail-actions button:disabled {
  color: #7c8796;
  background: #eef2f7;
  border-color: #e6ebf2;
  box-shadow: none;
  cursor: not-allowed;
}

.page-custom-design {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 14px;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
  padding: 12px 10px 10px;
  background: #f4f7fb;
}

.custom-design-header {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) 92px;
  align-items: center;
  min-height: 44px;
  color: #152033;
}

.custom-design-header strong {
  overflow: hidden;
  font-size: 17px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-round-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #e8edf5;
  border-radius: 50%;
  color: #1b2638;
  background: #fff;
  box-shadow: 0 10px 22px rgba(31, 55, 83, 0.08);
}

.custom-design-header > .custom-round-button {
  justify-self: start;
}

.custom-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.custom-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #d9e3f2;
  border-top-color: #3478f6;
  border-radius: 50%;
  animation: custom-spin 0.9s linear infinite;
}

@keyframes custom-spin {
  to {
    transform: rotate(360deg);
  }
}

.custom-chat-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #e8edf5;
  background: #fff;
  box-shadow: 0 16px 38px rgba(37, 58, 89, 0.08);
}

.custom-chat-scroll {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 14px 12px 10px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.custom-chat-scroll::-webkit-scrollbar {
  display: none;
}

.custom-chat-message {
  display: grid;
  gap: 8px;
}

.custom-chat-message.ai {
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: start;
}

.custom-chat-message.user {
  justify-items: end;
}

.custom-chat-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: #171b24;
  font-size: 12px;
  font-weight: 950;
}

.custom-chat-bubble {
  min-width: 0;
  max-width: 100%;
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  color: #152033;
  background: #f7f9fc;
  border: 1px solid #edf1f7;
}

.custom-chat-message.user .custom-chat-bubble {
  max-width: min(82%, 280px);
  color: #fff;
  background: #3478f6;
  border-color: #3478f6;
}

.custom-chat-bubble > strong {
  font-size: 14px;
  line-height: 1.4;
}

.custom-chat-bubble > span {
  color: #66758c;
  font-size: 12px;
  line-height: 1.5;
}

.custom-chat-message.user .custom-chat-bubble > span {
  color: #fff;
  font-size: 14px;
  font-weight: 850;
}

.custom-chat-message.user .custom-chat-image {
  width: 116px;
  justify-self: end;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.16);
}

.custom-chat-message.user .custom-chat-image img {
  max-height: 118px;
  border-radius: 10px;
}

.custom-chat-bubble header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.custom-chat-bubble header strong {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-chat-bubble header small {
  flex: 0 0 auto;
  color: #8b96a8;
  font-size: 11px;
  font-weight: 750;
}

.custom-chat-image {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #eef2f7;
}

.custom-chat-image img {
  width: 100%;
  max-height: 290px;
  display: block;
  object-fit: contain;
}

.custom-chat-image.source img {
  max-height: 240px;
}

.custom-chat-image figcaption {
  padding: 8px 10px;
  color: #748196;
  font-size: 11px;
  font-weight: 800;
}

.custom-chat-state {
  display: grid;
  justify-items: start;
  gap: 7px;
  padding: 10px;
  border-radius: 12px;
  background: #eef4ff;
}

.custom-chat-state.processing {
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: center;
}

.custom-chat-state.processing .custom-spinner {
  width: 24px;
  height: 24px;
}

.custom-chat-state.processing span:last-child {
  grid-column: 2;
  color: #66758c;
  font-size: 12px;
  line-height: 1.4;
}

.custom-chat-state.failed strong {
  color: #c93636;
}

.custom-chat-state.failed span {
  color: #8a4d4d;
  font-size: 12px;
}

.custom-chat-text-reply {
  padding: 10px;
  border-radius: 12px;
  background: #eef4ff;
}

.custom-chat-text-reply span {
  color: #26364f;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.custom-chat-actions {
  display: grid;
  gap: 10px;
}

.custom-chat-feedback-actions,
.custom-chat-result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-chat-actions button {
  min-height: 34px;
  border: 0;
  border-radius: 17px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #43536a;
  background: #eef2f7;
  font-size: 12px;
  font-weight: 850;
}

.custom-chat-feedback-actions button.active {
  color: #111827;
  background: #ffe94b;
}

.custom-chat-result-actions button.apply {
  min-width: 100%;
  color: #fff;
  background: #3478f6;
  font-size: 13px;
}

.custom-chat-actions button:disabled {
  color: #8b96a8;
  background: #eef2f7;
  cursor: not-allowed;
}

.custom-reference-preview {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 7px;
  border: 1px solid #e6ebf2;
  border-radius: 14px;
  background: #f7f9fc;
}

.custom-reference-preview img {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  object-fit: cover;
  background: #eef2f7;
}

.custom-reference-preview span {
  min-width: 0;
  color: #324158;
  font-size: 12px;
  font-weight: 850;
}

.custom-reference-preview button {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #65758b;
  background: #fff;
}

.custom-chat-composer-panel {
  display: grid;
  gap: 10px;
  padding: 10px 12px 12px;
  border-top: 1px solid #edf1f7;
  background: #fff;
}

.custom-prompt-examples {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.custom-prompt-examples,
.custom-style-strip {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.custom-prompt-examples::-webkit-scrollbar {
  display: none;
}

.custom-prompt-examples button {
  flex: 0 0 auto;
  min-height: 34px;
  border: 1px solid #e6ebf2;
  border-radius: 17px;
  padding: 0 12px;
  color: #324158;
  background: #f7f9fc;
  font-size: 12px;
  font-weight: 850;
  white-space: nowrap;
}

.custom-prompt-examples button:disabled {
  opacity: 0.5;
}

.custom-style-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 74px;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.custom-style-strip::-webkit-scrollbar {
  display: none;
}

.custom-style-strip button {
  position: relative;
  width: 74px;
  height: 92px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: #5f5f5f;
}

.custom-style-strip button:disabled {
  opacity: 0.6;
}

.custom-style-strip img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.custom-style-strip span {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 4px 7px;
  color: #fff;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.74));
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.custom-composer {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 62px;
  gap: 10px;
  align-items: end;
}

.custom-style-toggle,
.custom-send-button {
  height: 42px;
  border: 1px solid #e6ebf2;
  border-radius: 21px;
  color: #324158;
  background: #f7f9fc;
  font-weight: 950;
}

.custom-style-toggle {
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.custom-style-toggle.active {
  color: #fff;
  background: #3478f6;
  border-color: #3478f6;
}

.custom-style-toggle:disabled,
.custom-send-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.custom-composer input {
  min-width: 0;
  min-height: 42px;
  border: 1px solid #e6ebf2;
  border-radius: 21px;
  padding: 0 14px;
  outline: 0;
  color: #17243a;
  background: #f7f9fc;
  font-size: 14px;
}

.custom-composer input::placeholder {
  color: #9aa3b2;
}

.custom-send-button {
  border: 0;
  color: #fff;
  background: #3478f6;
  font-size: 14px;
}

.page-custom-records {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  padding: 12px 14px 16px;
  background: #f4f7fb;
}

.custom-records-header {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 48px;
}

.custom-records-back {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #1b2638;
  background: #fff;
  box-shadow: 0 10px 22px rgba(31, 55, 83, 0.1);
}

.custom-records-header div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.custom-records-header strong {
  color: #152033;
  font-size: 21px;
}

.custom-records-header small {
  min-width: 0;
  overflow: hidden;
  color: #68768a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-record-summary {
  display: grid;
  grid-template-columns: 0.8fr 0.8fr 1.35fr;
  gap: 9px;
}

.custom-record-summary article {
  min-width: 0;
  display: grid;
  gap: 5px;
  padding: 12px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 24px rgba(38, 61, 92, 0.08);
}

.custom-record-summary span {
  min-width: 0;
  overflow: hidden;
  color: #142033;
  font-size: 18px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-record-summary small {
  color: #778397;
  font-size: 12px;
  font-weight: 800;
}

.custom-record-empty {
  align-self: start;
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 28px 20px;
  border-radius: 20px;
  background: #fff;
  text-align: center;
}

.custom-record-empty strong {
  color: #17243a;
  font-size: 19px;
}

.custom-record-empty span {
  color: #6d7a8d;
  font-size: 13px;
  line-height: 1.6;
}

.custom-record-empty button {
  min-height: 38px;
  border: 0;
  border-radius: 19px;
  padding: 0 16px;
  color: #111;
  background: #fff500;
  font-weight: 900;
}

.custom-record-list {
  min-height: 0;
  display: grid;
  gap: 12px;
  align-content: start;
  overflow-y: auto;
  padding-bottom: 4px;
}

.custom-record-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 14px 28px rgba(38, 61, 92, 0.09);
}

.custom-record-card header,
.custom-record-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.custom-record-card header small {
  color: #7d8798;
  font-size: 12px;
  font-weight: 800;
}

.custom-record-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
}

.custom-record-status.submitted,
.custom-record-status.processing {
  color: #7a5600;
  background: #fff3bf;
}

.custom-record-status.completed {
  color: #17623e;
  background: #dff8ea;
}

.custom-record-status.applied {
  color: #3f3200;
  background: #fff3a6;
}

.custom-record-status.failed {
  color: #9d2b2b;
  background: #ffe8e8;
}

.custom-record-images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.custom-record-images figure {
  position: relative;
  min-width: 0;
  overflow: hidden;
  margin: 0;
  border-radius: 14px;
  background: #eef3f8;
}

.custom-record-images img,
.custom-record-images figure > span {
  width: 100%;
  aspect-ratio: 1.18;
  display: grid;
  place-items: center;
  object-fit: cover;
}

.custom-record-images figure > span {
  color: #7a8798;
  font-size: 13px;
  font-weight: 900;
}

.custom-record-images figcaption {
  position: absolute;
  left: 7px;
  bottom: 7px;
  padding: 4px 7px;
  border-radius: 999px;
  color: #fff;
  background: rgba(0, 0, 0, 0.48);
  font-size: 11px;
  font-weight: 900;
}

.custom-record-body {
  display: grid;
  gap: 5px;
}

.custom-record-body strong {
  color: #17243a;
  font-size: 15px;
  line-height: 1.45;
}

.custom-record-body span {
  min-width: 0;
  overflow: hidden;
  color: #748197;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-record-card footer {
  justify-content: flex-end;
}

.custom-record-pending-text {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  color: #6b7588;
  background: #f3f6fa;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.custom-record-card footer button {
  min-height: 34px;
  border: 0;
  border-radius: 17px;
  padding: 0 12px;
  color: #2654bd;
  background: #eaf1ff;
  font-size: 12px;
  font-weight: 900;
}

.custom-record-card footer button:first-child {
  color: #111;
  background: #fff500;
}

.custom-record-card footer button:last-child {
  color: #111;
  background: #fff500;
}

.custom-record-card footer button:disabled {
  color: #9aa5b5;
  background: #edf1f6;
  cursor: not-allowed;
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
}

.assistant-header strong {
  font-size: 17px;
}

.assistant-new-button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  color: #fff;
  background: #3478f6;
  font-size: 13px;
  font-weight: 800;
}

.assistant-chat {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  padding: 10px 0 0;
}

.assistant-context-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 11px;
  border-radius: 14px;
  color: #2654bd;
  background: #eaf1ff;
  font-size: 12px;
  font-weight: 900;
}

.assistant-context-pill small {
  min-width: 0;
  overflow: hidden;
  color: #6a7891;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-quick-list {
  min-width: 0;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.assistant-quick-list::-webkit-scrollbar {
  display: none;
}

.assistant-quick-list button {
  flex: 0 0 auto;
  min-height: 40px;
  border: 1px solid rgba(52, 120, 246, 0.14);
  border-radius: 20px;
  padding: 0 13px;
  color: #27344d;
  background: #fff;
  font-size: 13px;
  font-weight: 800;
}

.assistant-message-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  border-top: 1px solid rgba(130, 146, 170, 0.12);
}

.assistant-message-list {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding: 16px 0 14px;
  scrollbar-width: none;
}

.assistant-message-list::-webkit-scrollbar {
  display: none;
}

.assistant-message-list.empty {
  justify-content: center;
  padding: 20px 0;
}

.assistant-empty-state {
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
}

.assistant-empty-avatar {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #111317;
  box-shadow: 0 14px 28px rgba(17, 19, 23, 0.12);
}

.assistant-empty-avatar img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.assistant-empty-state strong {
  font-size: 18px;
  font-weight: 900;
  color: #172033;
}

.assistant-empty-state p {
  max-width: 270px;
  margin: 0;
  color: #6f7c90;
  font-size: 13px;
  line-height: 1.55;
}

.assistant-message-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.assistant-message-row.user {
  grid-template-columns: minmax(0, 1fr) 32px;
  justify-items: end;
}

.assistant-message-avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #111317;
}

.assistant-message-avatar img {
  width: 19px;
  height: 19px;
  object-fit: contain;
}

.assistant-message-avatar.user-avatar {
  overflow: hidden;
  background: #e8edf7;
}

.assistant-message-avatar.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assistant-message-content {
  max-width: min(282px, 78vw);
  display: grid;
  gap: 5px;
  justify-items: start;
}

.assistant-message-row.user .assistant-message-content {
  justify-items: end;
}

.assistant-message-bubble {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px 16px 16px 6px;
  color: #172033;
  background: #fff;
  box-shadow: 0 8px 20px rgba(35, 47, 70, 0.07);
}

.assistant-message-row.user .assistant-message-bubble {
  border-radius: 16px 16px 6px;
  color: #fff;
  background: #256eff;
  box-shadow: 0 10px 20px rgba(37, 110, 255, 0.2);
}

.assistant-message-row.image-only .assistant-message-bubble {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.assistant-message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: inherit;
  font-size: 14px;
  line-height: 1.58;
}

.assistant-message-row.failed .assistant-message-bubble p {
  color: #d43131;
}

.assistant-message-image {
  width: min(210px, 100%);
  max-height: 210px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(35, 47, 70, 0.1);
  object-fit: contain;
  cursor: pointer;
}

.assistant-message-content time {
  padding: 0 4px;
  color: #8e9aad;
  font-size: 10px;
  line-height: 1;
}

.assistant-composer {
  position: relative;
  display: grid;
  gap: 8px;
  padding: 9px 0 0;
  border-top: 1px solid rgba(130, 146, 170, 0.18);
  background: #f5f8fd;
}

.assistant-composer-row {
  min-height: 42px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 38px;
  gap: 8px;
  align-items: end;
}

.assistant-icon-action,
.assistant-send-action {
  width: 34px;
  height: 34px;
  border: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #3478f6;
  background: #fff;
  box-shadow: 0 5px 12px rgba(35, 47, 70, 0.08);
}

.assistant-send-action {
  width: 38px;
  color: #fff;
  background: #3478f6;
}

.assistant-icon-action:disabled,
.assistant-send-action:disabled {
  color: #a8b2c2;
  background: #edf2f8;
  box-shadow: none;
}

.assistant-composer textarea {
  min-height: 36px;
  max-height: 108px;
  border: 1px solid rgba(120, 136, 160, 0.18);
  border-radius: 18px;
  resize: none;
  padding: 9px 12px;
  color: #172033;
  background: #fff;
  font-size: 14px;
  line-height: 18px;
  outline: none;
}

.assistant-composer textarea:focus {
  border-color: rgba(52, 120, 246, 0.45);
  box-shadow: 0 0 0 2px rgba(52, 120, 246, 0.08);
}

.assistant-file-input {
  display: none;
}

.assistant-attachment-menu {
  position: absolute;
  left: 0;
  bottom: 56px;
  z-index: 3;
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(35, 47, 70, 0.14);
}

.assistant-attachment-menu button {
  min-width: 72px;
  border: 0;
  display: grid;
  justify-items: center;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 12px;
  color: #26344d;
  background: #f4f7fb;
  font-size: 12px;
  font-weight: 800;
}

.assistant-attachment-preview {
  justify-self: start;
  display: flex;
  align-items: center;
  gap: 6px;
}

.assistant-attachment-preview button {
  border: 0;
  background: transparent;
  padding: 0;
}

.assistant-attachment-preview button:first-child {
  position: relative;
  width: 58px;
  height: 58px;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(35, 47, 70, 0.12);
}

.assistant-attachment-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assistant-attachment-preview span {
  position: absolute;
  right: 4px;
  bottom: 4px;
  border-radius: 999px;
  padding: 2px 5px;
  color: #fff;
  background: rgba(17, 19, 23, 0.68);
  font-size: 10px;
  font-weight: 800;
}

.assistant-attachment-preview button:last-child {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #172033;
}

.page-header,
.page-title-row,
.profile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header {
  height: 48px;
}

.page-header strong {
  min-width: 0;
  overflow: hidden;
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #182338;
  background: #fff;
}

.step-indicator {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 8px 0 16px;
}

.step-indicator span {
  height: 5px;
  border-radius: 99px;
  background: #d5dee9;
}

.step-indicator span.active {
  background: #235bff;
}

.design-panel {
  min-height: 500px;
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 18px 32px rgba(49, 79, 120, 0.11);
}

.design-panel h2 {
  margin: 0;
  color: #13243b;
  font-size: 22px;
}

.design-panel p {
  margin: 0;
  color: #667892;
  line-height: 1.5;
}

.upload-art {
  width: 100%;
  aspect-ratio: 1.28;
  border-radius: 18px;
  object-fit: cover;
}

.upload-zone {
  min-height: 76px;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px dashed #8aa7c7;
  border-radius: 16px;
  color: #235bff;
  background: #f4f8ff;
  font-weight: 900;
  text-align: left;
}

.upload-zone img {
  width: 42px;
  height: 42px;
}

.guide-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.guide-compare figure {
  margin: 0;
  overflow: hidden;
  border-radius: 14px;
  background: #eef3f8;
}

.guide-compare img {
  width: 100%;
  aspect-ratio: 1.12;
  object-fit: cover;
}

.guide-compare figcaption {
  padding: 8px;
  color: #44566e;
  font-size: 12px;
  font-weight: 850;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.select-chip {
  min-height: 48px;
  border: 1px solid #d6e0ec;
  border-radius: 14px;
  color: #273a55;
  background: #f7faff;
  font-weight: 850;
}

.select-chip.active {
  border-color: #235bff;
  color: #fff;
  background: #235bff;
}

.tool-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 4px;
}

.tool-button {
  min-height: 74px;
  display: grid;
  place-items: center;
  gap: 6px;
  border: 0;
  border-radius: 14px;
  color: #263a54;
  background: #f1f6fc;
  font-size: 12px;
  font-weight: 850;
}

.tool-button img {
  width: 28px;
  height: 28px;
}

.result-panel {
  text-align: center;
}

.detecting {
  justify-self: center;
  width: 128px;
  height: 128px;
  object-fit: contain;
}

.result-preview {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  background: #f4f8ff;
  text-align: left;
}

.result-preview img {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  object-fit: cover;
}

.result-preview div {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.custom-design-entry {
  min-height: 44px;
  border: 0;
  border-radius: 22px;
  color: #fff;
  background: #3478f6;
  font-weight: 900;
}

.custom-design-entry.secondary {
  color: #2654bd;
  background: #eaf1ff;
}

.bottom-action {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
}

.page-discover,
.page-mine,
.page-vip-purchase {
  background: #f6f8fb;
}

.page-mine {
  scrollbar-width: none;
}

.page-mine::-webkit-scrollbar {
  display: none;
}

.page-vip-purchase {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 14px;
  padding: 14px 16px 22px;
  overflow: hidden;
}

.vip-purchase-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.vip-purchase-head strong {
  color: #111827;
  font-size: 17px;
}

.vip-purchase-head > span {
  width: 36px;
}

.vip-purchase-hero {
  display: grid;
  gap: 10px;
  padding: 22px 18px;
  border-radius: 20px;
  color: #2b1a08;
  background: linear-gradient(135deg, #fff1a7 0%, #d7f971 55%, #8de3c5 100%);
  box-shadow: 0 18px 32px rgba(71, 107, 58, 0.16);
}

.vip-purchase-hero img {
  width: 128px;
}

.vip-purchase-hero h2,
.vip-purchase-hero p {
  margin: 0;
}

.vip-purchase-hero h2 {
  font-size: 25px;
  line-height: 1.2;
}

.vip-purchase-hero p {
  max-width: 300px;
  color: rgba(43, 26, 8, 0.78);
  font-size: 14px;
  font-weight: 750;
  line-height: 1.45;
}

.vip-purchase-benefits {
  min-height: 0;
  display: grid;
  gap: 10px;
  align-content: start;
  overflow-y: auto;
}

.vip-purchase-benefits article {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 24px rgba(43, 61, 89, 0.08);
}

.vip-purchase-benefits strong {
  color: #172033;
  font-size: 16px;
}

.vip-purchase-benefits span {
  color: #6b7380;
  font-size: 13px;
  font-weight: 720;
  line-height: 1.45;
}

.vip-purchase-action {
  min-height: 48px;
  border: 0;
  border-radius: 24px;
  color: #fff;
  background: #151515;
  font-size: 16px;
  font-weight: 950;
}

.vip-purchase-action:disabled {
  opacity: 0.72;
}

.vip-purchase-status {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  color: #5f4912;
  background: #fff6d8;
  font-size: 13px;
  font-weight: 780;
  line-height: 1.4;
}

.page-title-row {
  padding: 8px 0 14px;
}

.page-title-row h2 {
  margin: 4px 0 0;
  color: #13243b;
  font-size: 24px;
}

.page-title-row img {
  width: 92px;
  height: 92px;
  border-radius: 18px;
  object-fit: cover;
}

.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-tabs button {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 18px;
  color: #44566e;
  background: #e9eff6;
  font-weight: 850;
}

.category-tabs button.active {
  color: #fff;
  background: #182338;
}

.discover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.discover-card {
  min-width: 0;
  display: grid;
  gap: 7px;
  padding: 9px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 12px 22px rgba(51, 78, 112, 0.1);
}

.discover-card img {
  width: 100%;
  aspect-ratio: 0.86;
  border-radius: 13px;
  object-fit: cover;
}

.discover-card strong {
  min-width: 0;
  overflow: hidden;
  color: #14233d;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-head {
  padding: 14px;
  border-radius: 20px;
  color: #fff;
  background: linear-gradient(135deg, #1b2b46, #244d82);
}

.profile-head > img {
  width: 58px;
  height: 58px;
  border-radius: 16px;
}

.profile-head div {
  min-width: 0;
  flex: 1;
}

.profile-head h2,
.profile-head p {
  margin: 0;
}

.profile-head p {
  min-width: 0;
  overflow: hidden;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-head > span {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 13px;
  color: #2a220f;
  background: #ffe092;
  font-size: 12px;
  font-weight: 900;
}

.profile-settings-button {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #182338;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 18px rgba(12, 24, 42, 0.16);
}

.vip-card {
  position: relative;
  min-height: 124px;
  width: 100%;
  overflow: hidden;
  margin-top: 12px;
  padding: 0;
  border: 0;
  border-radius: 20px;
  color: #3f2c12;
  background: #fff3a3;
  text-align: left;
}

.vip-card > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vip-card div {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 7px;
  padding: 18px;
}

.vip-card div img {
  width: 96px;
}

.vip-card strong {
  font-size: 23px;
}

.settings-error {
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  color: #9d2b2b;
  background: #fff0f0;
  font-size: 12px;
  line-height: 1.5;
}

.settings-address-panel {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  color: #fff;
  background: #24272f;
}

.settings-address-panel header {
  display: grid;
  gap: 3px;
}

.settings-address-panel header strong {
  font-size: 15px;
}

.settings-address-panel header small {
  overflow: hidden;
  color: #aeb6c5;
  font-size: 11px;
  font-weight: 760;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-address-panel label {
  display: grid;
  gap: 6px;
}

.settings-address-panel label span {
  color: #d8deea;
  font-size: 12px;
  font-weight: 820;
}

.settings-address-panel input {
  min-width: 0;
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #f7f9ff;
  background: #171a21;
  font-size: 13px;
  outline: none;
}

.settings-address-panel input:focus {
  border-color: #36c7f7;
  box-shadow: 0 0 0 3px rgba(54, 199, 247, 0.14);
}

.settings-address-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.settings-address-actions button {
  min-width: 0;
  height: 38px;
  border: 0;
  border-radius: 10px;
  color: #ecf3ff;
  background: #343844;
  font-size: 13px;
  font-weight: 860;
}

.settings-address-actions button[type='submit'] {
  color: #102237;
  background: #36d6f4;
}

.settings-user-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  color: #121a2a;
  background: #f7f9fc;
}

.settings-user-panel span {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.settings-user-panel strong {
  font-size: 13px;
  font-weight: 900;
}

.settings-user-panel small {
  overflow: hidden;
  color: #697487;
  font-size: 12px;
  font-weight: 760;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-user-panel button {
  min-width: 72px;
  height: 34px;
  display: inline-grid;
  grid-template-columns: auto auto;
  gap: 5px;
  place-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  color: #101928;
  background: #fff500;
  font-size: 12px;
  font-weight: 900;
}

.settings-user-panel button:disabled {
  color: #9aa3b2;
  background: #e9edf4;
}

.settings-row-list {
  display: grid;
  gap: 10px;
}

.settings-row-list button {
  min-height: 58px;
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: #24272f;
  text-align: left;
}

.settings-row-list button span {
  font-weight: 820;
}

.settings-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 22px;
}

.settings-modal-mask {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(13, 20, 34, 0.48);
  backdrop-filter: blur(8px);
}

.settings-modal-panel {
  position: relative;
  z-index: 1;
  width: min(392px, calc(100vw - 44px));
  max-height: min(760px, calc(100vh - 64px));
  overflow-y: auto;
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 24px;
  background: #f6f8fc;
  box-shadow: 0 24px 68px rgba(13, 25, 44, 0.32);
}

.settings-modal-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-modal-panel > header div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.settings-modal-panel > header strong {
  color: #17243a;
  font-size: 18px;
}

.settings-modal-panel > header small {
  color: #748196;
  font-size: 12px;
  font-weight: 850;
}

.settings-modal-panel > header button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #202b3d;
  background: #fff;
}

.mine-tabs {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 18px 0 14px;
}

.mine-tabs button {
  min-width: 0;
  position: relative;
  padding: 4px 0 8px;
  border: 0;
  color: #9aa1ad;
  background: transparent;
  font-size: 21px;
  font-weight: 950;
  line-height: 1.15;
}

.mine-tabs button.active {
  color: #171b24;
}

.mine-tabs button.active::after {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 22px;
  height: 4px;
  border-radius: 999px;
  background: #256eff;
  content: "";
  transform: translateX(-50%);
}

.work-list {
  padding-bottom: 6px;
}

.work-list > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.work-list > header button {
  border: 0;
  border-radius: 999px;
  padding: 7px 11px;
  color: #fff;
  background: #3478f6;
  font-size: 12px;
  font-weight: 900;
}

.work-list > header button:disabled {
  background: #aeb8c8;
}

.work-list-error,
.work-list-empty {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.work-list-error {
  color: #9d2b2b;
  background: #fff0f0;
}

.work-list-empty {
  color: #66758c;
  background: #fff;
}

.assistant-history-list {
  display: grid;
  gap: 14px;
  padding-bottom: 92px;
}

.assistant-history-list > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.assistant-history-list h3 {
  margin: 0;
  color: #171b24;
  font-size: 16px;
  font-weight: 950;
}

.assistant-history-list > header button {
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  color: #fff;
  background: #256eff;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 8px 16px rgba(37, 110, 255, 0.22);
}

.assistant-history-list > header button:disabled {
  background: #aeb8c8;
}

.assistant-history-error,
.assistant-history-empty {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.assistant-history-error {
  color: #9d2b2b;
  background: #fff0f0;
}

.assistant-history-empty {
  color: #66758c;
  background: #fff;
}

.assistant-history-group {
  display: grid;
  gap: 8px;
}

.assistant-history-group h4 {
  margin: 0 0 1px;
  padding-left: 2px;
  color: #8d96a7;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
}

.assistant-history-card {
  min-width: 0;
  min-height: 68px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 11px;
  border: 1px solid rgba(141, 154, 174, 0.16);
  border-radius: 15px;
  color: #171b24;
  background: #fff;
  text-align: left;
  box-shadow: 0 8px 18px rgba(35, 47, 70, 0.04);
}

.assistant-history-card:active {
  background: #f8fbff;
}

.assistant-history-icon-wrap {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #111317;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.assistant-history-icon {
  /* 历史会话统一复用底部 AI 助手入口图标，避免按标题误分类。 */
  width: 25px;
  height: 25px;
  display: block;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.assistant-history-copy {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.assistant-history-copy strong,
.assistant-history-copy small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-history-copy strong {
  color: #171b24;
  font-size: 14px;
  font-weight: 950;
}

.assistant-history-copy small {
  color: #7a8495;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}

.assistant-history-meta {
  height: 42px;
  display: grid;
  justify-items: end;
  align-content: space-between;
}

.assistant-history-time {
  color: #9aa1ad;
  font-size: 12px;
  font-weight: 900;
}

.assistant-history-arrow {
  color: #c2cad6;
}

.work-row {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  background: #fff;
}

.work-row img {
  width: 72px;
  height: 72px;
  border-radius: 13px;
  object-fit: cover;
}

.work-info {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.work-row button {
  border: 0;
  border-radius: 999px;
  padding: 7px 10px;
  color: #fff;
  background: #3478f6;
  font-size: 12px;
  font-weight: 900;
}

.work-row button.custom {
  color: #17324f;
  background: #d9f4ee;
}

.work-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-nav {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid rgba(101, 126, 153, 0.14);
  background: rgba(255, 255, 255, 0.95);
}

.bottom-nav button {
  min-width: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  border: 0;
  color: #8190a4;
  background: transparent;
  font-size: 11px;
  font-weight: 850;
}

.bottom-nav button.active {
  color: #235bff;
}

.bottom-nav img {
  width: 24px;
  height: 24px;
}

.toast-message {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 20;
  max-width: min(360px, calc(100vw - 36px));
  transform: translateX(-50%);
  margin: 0;
  padding: 11px 14px;
  border-radius: 16px;
  color: #fff;
  background: rgba(20, 28, 42, 0.92);
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(10, 20, 35, 0.22);
}

.toast-message.error {
  background: rgba(151, 34, 34, 0.92);
}

@media (max-width: 520px) {
  .app-frame {
    padding: 0;
  }

  .phone-shell {
    width: 100vw;
    height: 100vh;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }

  .onboarding-page {
    padding-right: 16px;
    padding-left: 16px;
  }

  .hero-copy {
    width: 76%;
  }
}
</style>
