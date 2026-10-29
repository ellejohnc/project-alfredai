# GoHighLevel Public API v3 — full endpoint index

Generated from the official SDK `@gohighlevel/api-client@3.0.0` (npm), which is
published from HighLevel's own OpenAPI spec. `marketplace.gohighlevel.com` is
blocked by our network egress proxy, but **registry.npmjs.org is reachable**, so
this package is how we read the full API surface without leaving the sandbox.

Refresh with:

```sh
cd /tmp && npm pack @gohighlevel/api-client && tar xzf gohighlevel-api-client-*.tgz
# types live in package/dist/lib/code/<resource>/<resource>.d.ts
# request/response models in package/dist/lib/code/<resource>/models/<resource>.d.ts
```

Base URL `https://services.leadconnectorhq.com` · header `Version: v3` · bearer token (Sub-Account).

---

## ad-manager  (94)

`fbGetReporting`, `fbGetCampaignReporting`, `fbGetReportingList`, `fbGetCurrentUser`, `fbGetPages`, `fbGetInstagramAccounts`, `fbGetPageLeadForms`, `fbCreatePageLeadForm`, `fbGetAdAccounts`, `fbGetAdAccount`, `fbDeleteAdAccount`, `fbGetConversationForms`, `fbCreateConversationForm`, `fbCreateIntegration`, `fbGetIntegration`, `fbDeleteIntegration`, `fbSearchTargeting`, `fbPublishCampaign`, `fbDeletePage`, `fbGetPixels`, `fbUpsertPixel`, `fbGetCustomAudiences`, `fbDeleteCustomAudience`, `fbUpdateCustomAudience`, `fbGetCustomAudienceById`, `fbAddCustomAudienceMember`, `fbRemoveCustomAudienceMember`, `fbBatchUpdateAudienceMembers`, `fbSetDefaultPage`, `fbGetLeadForm`, `fbGetCampaign`, `fbGetEntity`, `fbUpsertCampaign`, `fbUpsertAdset`, `fbUpsertAd`, `fbPauseCampaign`, `fbResumeCampaign`, `fbDuplicateCampaign`, `fbDeleteCampaign`, `fbPauseAdset`, `fbResumeAdset`, `fbDuplicateAdset`, `fbDeleteAdset`, `fbPauseAd`, `fbResumeAd`, `fbDuplicateAd`, `fbDeleteAd`, `googleGetReporting`, `googleGetReportingList`, `googleGetCampaignReporting`, `googleGetConversions`, `googleUpsertConversion`, `googleGetConversionById`, `googleDeleteConversion`, `googleGetIntegration`, `googleCreateIntegration`, `googleGetCurrentUser`, `googleGetAdAccounts`, `googleGetAdAccountDetails`, `googleDeleteAdAccount`, `googlePublishAd`, `googleSearchTargeting`, `googleGetKeywordIdeas`, `googleGetAssets`, `googleUpsertAssets`, `googleGetEntity`, `googleGetTargetInterests`, `googleGetSegments`, `googleUpsertSegment`, `googleDeleteSegment`, `googleGetSegmentById`, `googleCreateOfflineUserListJob`, `googleUpsertAudience`, `googleGetAudiences`, `googleGetAudienceById`, `googleUpsertCampaign`, `googleGetCampaignById`, `googleGetConversionGoals`, `liGetIntegration`, `liCreateIntegration`, `liGetAdAccounts`, `liGetAdAccountDetails`, `liDeleteAdAccount`, `liGetCurrentUser`, `liGetCampaignGroup`, `liPublishCampaignGroup`, `liUpsertCampaignGroup`, `liSearchTargeting`, `liGetLeadForms`, `liCreateLeadForm`, `liUpdateAdStatus`, `liGetAdAnalytics`, `liGetReportingList`, `liGetCampaignGroupReporting`

## affiliate-manager  (4)

`listAffiliates`, `getAffiliate`, `listPayouts`, `listCommissions`

## agent-studio  (11)

`createAgent`, `getAgents`, `updateAgentVersion`, `updateAgentMetadata`, `deleteAgent`, `getAgentById`, `promoteAndPublish`, `executeAgent`, `getAgentsDeprecated`, `getAgentByIdDeprecated`, `executeAgentDeprecated`

## associations  (10)

`createRelation`, `getRelationsByRecordId`, `deleteRelation`, `getAssociationKeyByKeyName`, `getAssociationByObjectKeys`, `updateAssociation`, `deleteAssociation`, `getAssociationByID`, `createAssociation`, `findAssociations`

## blogs  (7)

`checkUrlSlugExists`, `updateBlogPost`, `createBlogPost`, `getAllBlogAuthorsByLocation`, `getAllCategoriesByLocation`, `getBlogPost`, `getBlogs`

## brand-boards  (5)

`getBrandBoardsByLocation`, `getBrandBoardById`, `updateBrandBoard`, `deleteBrandBoard`, `createBrandBoard`

## businesses  (5)

`updateBusiness`, `deleteBusiness`, `getBusiness`, `getBusinessesByLocation`, `createBusiness`

## calendars  (41)

`getGroups`, `createCalendarGroup`, `validateGroupsSlug`, `deleteGroup`, `editGroup`, `disableGroup`, `createAppointment`, `editAppointment`, `getAppointment`, `getCalendarEvents`, `getBlockedSlots`, `createBlockSlot`, `editBlockSlot`, `getSlots`, `updateCalendar`, `getCalendar`, `deleteCalendar`, `deleteEvent`, `getAppointmentNotes`, `createAppointmentNote`, `updateAppointmentNote`, `deleteAppointmentNote`, `getCalendarResource`, `updateCalendarResource`, `deleteCalendarResource`, `fetchCalendarResources`, `createCalendarResource`, `getEventNotification`, `createEventNotification`, `findEventNotification`, `updateEventNotification`, `deleteEventNotification`, `getAllSchedules`, `getScheduleById`, `updateSchedule`, `deleteSchedule`, `createSchedule`, `addCalendarToSchedule`, `removeCalendarFromSchedule`, `getCalendars`, `createCalendar`

## campaigns  (1)

`getCampaigns`

## companies  (1)

`getCompany`

## contacts  (32)

`searchContactsAdvanced`, `getDuplicateContact`, `getAllTasks`, `createTask`, `getTask`, `updateTask`, `deleteTask`, `updateTaskCompleted`, `getAppointmentsForContact`, `addTags`, `removeTags`, `getAllNotes`, `createNote`, `getNote`, `updateNote`, `deleteNote`, `createAssociation`, `addRemoveContactFromBusiness`, `getContact`, `updateContact`, `deleteContact`, `upsertContact`, `getContactsByBusinessId`, `addFollowersContact`, `removeFollowersContact`, `addContactToCampaign`, `removeContactFromCampaign`, `removeContactFromEveryCampaign`, `addContactToWorkflow`, `deleteContactFromWorkflow`, `createContact`, `getContacts`

## conversation-ai  (12)

`createAction`, `listActions`, `getActionById`, `updateAction`, `deleteAction`, `updateFollowupSettings`, `createAgent`, `searchAgent`, `updateAgent`, `getAgent`, `deleteAgent`, `getGenerationDetails`

## conversations  (29)

`searchConversation`, `getConversation`, `updateConversation`, `deleteConversation`, `getAllCustomSubtypes`, `createCustomSubtype`, `updateCustomSubtype`, `getContactUnsubscriptionStatus`, `userSubscriptionChange`, `getEmailById`, `cancelScheduledEmailMessage`, `exportMessagesByLocation`, `getMessage`, `getMessages`, `sendANewMessage`, `addAnInboundMessage`, `addAnOutboundMessage`, `sendReviewReply`, `cancelScheduledMessage`, `uploadFileAttachments`, `initiateFileUpload`, `completeFileUpload`, `updateMessageStatus`, `addMessageAttachments`, `getMessageRecording`, `getMessageTranscription`, `downloadMessageTranscription`, `liveChatAgentTyping`, `createConversation`

## courses  (1)

`importCourses`

## custom-fields  (8)

`getCustomFieldById`, `updateCustomField`, `deleteCustomField`, `getCustomFieldsByObjectKey`, `createCustomFieldFolder`, `updateCustomFieldFolder`, `deleteCustomFieldFolder`, `createCustomField`

## custom-menus  (5)

`getCustomMenuById`, `deleteCustomMenu`, `updateCustomMenu`, `getCustomMenus`, `createCustomMenu`

## email-isv  (1)

`verifyEmail`

## emails  (5)

`fetchCampaigns`, `createTemplate`, `fetchTemplate`, `deleteTemplate`, `updateTemplate`

## forms  (3)

`getFormsSubmissions`, `uploadToCustomFields`, `getForms`

## funnels  (7)

`createRedirect`, `updateRedirectById`, `deleteRedirectById`, `fetchRedirectsList`, `getFunnels`, `getPagesByFunnelId`, `getPagesCountByFunnelId`

## invoices  (42)

`createInvoiceTemplate`, `listInvoiceTemplates`, `getInvoiceTemplate`, `updateInvoiceTemplate`, `deleteInvoiceTemplate`, `updateInvoiceTemplateLateFeesConfiguration`, `updateInvoicePaymentMethodsConfiguration`, `createInvoiceSchedule`, `listInvoiceSchedules`, `getInvoiceSchedule`, `updateInvoiceSchedule`, `deleteInvoiceSchedule`, `updateAndScheduleInvoiceSchedule`, `scheduleInvoiceSchedule`, `autoPaymentInvoiceSchedule`, `cancelInvoiceSchedule`, `text2payInvoice`, `generateInvoiceNumber`, `getInvoiceSettings`, `getInvoice`, `updateInvoice`, `deleteInvoice`, `updateInvoiceLateFeesConfiguration`, `voidInvoice`, `sendInvoice`, `recordInvoice`, `updateInvoiceLastVisitedAt`, `createNewEstimate`, `updateEstimate`, `deleteEstimate`, `generateEstimateNumber`, `sendEstimate`, `createInvoiceFromEstimate`, `listEstimates`, `updateEstimateLastVisitedAt`, `listEstimateTemplates`, `createEstimateTemplate`, `updateEstimateTemplate`, `deleteEstimateTemplate`, `previewEstimateTemplate`, `createInvoice`, `listInvoices`

## knowledge-base  (14)

`list`, `create`, `update`, `delete`, `getAllWebsiteUrlsDataByKnowledgeBase`, `discoverWebsite`, `deleteTrainedUrlsForKnowledgeBase`, `getCrawlingStatusForLatestOperation`, `trainDiscoveredUrls`, `getKnowledgeBaseById`, `deleteKnowledgeBase`, `updateKnowledgeBase`, `listAllKnowledgeBasesPaginated`, `createKnowledgeBase`

## links  (6)

`getLinkById`, `updateLink`, `deleteLink`, `searchTriggerLinks`, `getLinks`, `createLink`

## locations  (29)

`searchLocations`, `getLocation`, `putLocation`, `deleteLocation`, `getLocationTags`, `createTag`, `getTagById`, `updateTag`, `deleteTag`, `taskSearch`, `getRecurringTaskById`, `updateRecurringTask`, `deleteRecurringTask`, `createRecurringTask`, `getCustomFields`, `createCustomField`, `getCustomField`, `updateCustomField`, `deleteCustomField`, `uploadFileCustomFields`, `getCustomValues`, `createCustomValue`, `getCustomValue`, `updateCustomValue`, `deleteCustomValue`, `getTimezones`, `gETAllOrEmailSmsTemplates`, `dELETEAnEmailSmsTemplate`, `createLocation`

## marketplace  (9)

`charge`, `getCharges`, `deleteCharge`, `getSpecificCharge`, `hasFunds`, `uninstallApplication`, `getInstallerDetails`, `getRebillingConfigForApp`, `migrateConnection`

## medias  (7)

`fetchMediaContent`, `uploadMediaContent`, `deleteMediaContent`, `updateMediaObject`, `createMediaFolder`, `bulkUpdateMediaObjects`, `bulkDeleteMediaObjects`

## oauth  (5)

`getAuthorizationUrl`, `refreshToken`, `getAccessToken`, `getLocationAccessToken`, `getInstalledLocation`

## objects  (9)

`getObjectSchemaByKey`, `updateCustomObject`, `getRecordById`, `updateObjectRecord`, `deleteObjectRecord`, `createObjectRecord`, `searchObjectRecords`, `getObjectByLocationId`, `createCustomObjectSchema`

## opportunities  (12)

`getLostReason`, `searchOpportunity`, `searchOpportunitiesAdvanced`, `getPipelines`, `getOpportunity`, `deleteOpportunity`, `updateOpportunity`, `updateOpportunityStatus`, `upsertOpportunity`, `addFollowersOpportunity`, `removeFollowersOpportunity`, `createOpportunity`

## payments  (23)

`createIntegrationProvider`, `listIntegrationProviders`, `listOrders`, `getOrderById`, `recordOrderPayment`, `createOrderFulfillment`, `listOrderFulfillment`, `listOrderNotes`, `listTransactions`, `getTransactionById`, `listSubscriptions`, `getSubscriptionById`, `listCoupons`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `getCoupon`, `createIntegration`, `deleteIntegration`, `fetchConfig`, `createConfig`, `disconnectConfig`, `customProviderMarketplaceAppUpdateCapabilities`

## phone-system  (4)

`getNumberPoolList`, `availableNumbers`, `purchasePhoneNumber`, `activeNumbers`

## products  (27)

`bulkUpdate`, `bulkEdit`, `createPriceForProduct`, `listPricesForProduct`, `getListInventory`, `updateInventory`, `getPriceByIdForProduct`, `updatePriceByIdForProduct`, `deletePriceByIdForProduct`, `getProductStoreStats`, `updateStoreStatus`, `updateDisplayPriority`, `getProductCollection`, `createProductCollection`, `getProductCollectionId`, `updateProductCollection`, `deleteProductCollection`, `getProductReviews`, `getReviewsCount`, `updateProductReview`, `deleteProductReview`, `bulkUpdateProductReview`, `getProductById`, `deleteProductById`, `updateProductById`, `createProduct`, `listInvoices`

## proposals  (4)

`listDocumentsContracts`, `sendDocumentsContracts`, `listDocumentsContractsTemplates`, `sendDocumentsContractsTemplate`

## saas-api  (22)

`locationsDeprecated`, `updateSaasSubscriptionDeprecated`, `bulkDisableSaasDeprecated`, `enableSaasLocationDeprecated`, `pauseLocationDeprecated`, `updateRebillingDeprecated`, `getAgencyPlansDeprecated`, `getLocationSubscriptionDeprecated`, `bulkEnableSaasDeprecated`, `getSaasLocationsDeprecated`, `getSaasPlanDeprecated`, `locations`, `generatePaymentLink`, `bulkDisableSaas`, `enableSaasLocation`, `pauseLocation`, `updateRebilling`, `getAgencyPlans`, `getLocationSubscription`, `bulkEnableSaas`, `getSaasLocations`, `getSaasPlan`

## snapshots  (4)

`getCustomSnapshots`, `createSnapshotShareLink`, `getSnapshotPush`, `getLatestSnapshotPush`

## social-media-posting  (40)

`startGoogleOauth`, `getGoogleLocations`, `setGoogleLocations`, `getPosts`, `createPost`, `getPost`, `editPost`, `deletePost`, `bulkDeleteSocialPlannerPosts`, `getAccount`, `deleteAccount`, `startFacebookOauth`, `getFacebookPageGroup`, `attachFacebookPageGroup`, `startInstagramOauth`, `getInstagramPageGroup`, `attachInstagramPageGroup`, `startLinkedinOauth`, `getLinkedinPageProfile`, `attachLinkedinPageProfile`, `startTwitterOauth`, `getTwitterProfile`, `attachTwitterProfile`, `uploadCsv`, `getUploadStatus`, `setAccounts`, `getCsvPost`, `startCsvFinalize`, `deleteCsv`, `deleteCsvPost`, `startTiktokOauth`, `getTiktokProfile`, `attachTiktokProfile`, `startTiktokBusinessOauth`, `getTiktokBusinessProfile`, `getCategoriesLocationId`, `getCategoriesId`, `getTagsLocationId`, `getTagsByIds`, `getSocialMediaStatistics`

## store  (18)

`createShippingZone`, `listShippingZones`, `getShippingZones`, `updateShippingZone`, `deleteShippingZone`, `getAvailableShippingZones`, `createShippingRate`, `listShippingRates`, `getShippingRates`, `updateShippingRate`, `deleteShippingRate`, `createShippingCarrier`, `listShippingCarriers`, `getShippingCarriers`, `updateShippingCarrier`, `deleteShippingCarrier`, `createStoreSetting`, `getStoreSettings`

## surveys  (2)

`getSurveysSubmissions`, `getSurveys`

## users  (7)

`searchUsers`, `filterUsersByEmail`, `getUser`, `updateUser`, `deleteUser`, `getUserByLocation`, `createUser`

## voice-ai  (11)

`createAgent`, `getAgents`, `patchAgent`, `getAgent`, `deleteAgent`, `getCallLogs`, `getCallLog`, `createAction`, `updateAction`, `getAction`, `deleteAction`

## workflows  (1)

`getWorkflow`

