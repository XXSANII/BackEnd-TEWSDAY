# API documentation index

One file per endpoint, named `docs/<group>/<code>_<handlerName>.md`. The format is fixed - see the
`docs-generation` skill in [`.agent/skills/docs-generation/`](../.agent/skills/docs-generation/SKILL.md).

- The routes below are the ones actually mounted in `src/api`; the code is the endpoint's public
  contract and never changes.
- Auth per group: `template` = `authProtectMiddleware`, `me` = `authProtectMiddleware`, `storage` = `authProtectMiddleware`, `admin` = `authorizeAdminMiddleware`, `public` = `authGateMiddleware`, `auth` = per-route.

Rebuild the coverage check with:

```bash
grep -rhno "@code\s\+\w\+" src/api --include='*.controller.ts' | sort -u   # every endpoint code
ls docs/*/                                                                # every doc file
```

### auth

| Code | Method & path | Doc |
| --- | --- | --- |
| `auth_001_c` | `POST /api/v1/auth/register` | `auth/auth_001_c_register.md` |
| `auth_002_c` | `POST /api/v1/auth/login` | `auth/auth_002_c_login.md` |
| `auth_003_c` | `POST /api/v1/auth/oauth/:provider` | `auth/auth_003_c_oauthLogin.md` |
| `auth_004_c` | `POST /api/v1/auth/refresh-token` | `auth/auth_004_c_refreshToken.md` |
| `auth_005_c` | `POST /api/v1/auth/logout` | `auth/auth_005_c_logout.md` |
| `auth_006_s` | `POST /api/v1/auth/sessions/search` | `auth/auth_006_s_searchSession.md` |
| `auth_006_d` | `DELETE /api/v1/auth/sessions/:sessionId/delete` | `auth/auth_006_d_deleteSession.md` |

### storage

| Code | Method & path | Doc |
| --- | --- | --- |
| `storage_001_c` | `POST /api/v1/storage/presigned-upload` | `storage/storage_001_c_createPresignedUpload.md` |
| `storage_002_c` | `POST /api/v1/storage/confirm-upload` | `storage/storage_002_c_confirmUpload.md` |
| `storage_003_g` | `GET /api/v1/storage/:fileId/view-url` | `storage/storage_003_g_getFileViewUrl.md` |

### public

| Code | Method & path | Doc |
| --- | --- | --- |
| `pub_001_s` | `POST /api/v1/public/subjects/search` | `public/pub_001_s_searchSubject.md` |
| `pub_001_g` | `GET /api/v1/public/subjects/:subjectId/get` | `public/pub_001_g_getSubject.md` |
| `pub_002_s` | `POST /api/v1/public/tutors/search` | `public/pub_002_s_searchTutor.md` |
| `pub_002_g` | `GET /api/v1/public/tutors/:tutorId/get` | `public/pub_002_g_getTutor.md` |
| `pub_002_avail_g` | `GET /api/v1/public/tutors/:tutorId/availability/get` | `public/pub_002_avail_g_getPublicTutorAvailability.md` |
| `pub_002_rev_s` | `POST /api/v1/public/tutors/:tutorId/reviews/search` | `public/pub_002_rev_s_searchTutorReview.md` |
| `pub_003_s` | `POST /api/v1/public/jobs/search` | `public/pub_003_s_searchPublicJob.md` |
| `pub_003_g` | `GET /api/v1/public/jobs/:jobId/get` | `public/pub_003_g_getPublicJob.md` |
| `pub_003_share` | `POST /api/v1/public/jobs/:jobId/share` | `public/pub_003_share_sharePublicJob.md` |

### me

| Code | Method & path | Doc |
| --- | --- | --- |
| `me_001_g` | `GET /api/v1/me/profile/get` | `me/me_001_g_getProfile.md` |
| `me_001_mode` | `PUT /api/v1/me/profile/mode/edit` | `me/me_001_mode_editProfileMode.md` |
| `me_001_avatar` | `PUT /api/v1/me/profile/avatar/edit` | `me/me_001_avatar_editProfileAvatar.md` |
| `me_001_noti_e` | `PUT /api/v1/me/profile/notifications/edit` | `me/me_001_noti_e_editProfileNotifications.md` |
| `me_002_badge` | `GET /api/v1/me/badge-counts/get` | `me/me_002_badge_getBadgeCounts.md` |
| `me_002_s` | `POST /api/v1/me/notifications/search` | `me/me_002_s_searchNotification.md` |
| `me_002_read` | `PUT /api/v1/me/notifications/:id/read` | `me/me_002_read_readNotification.md` |
| `me_003_g` | `GET /api/v1/me/tutor/get` | `me/me_003_g_getMyTutorProfile.md` |
| `me_003_e` | `PUT /api/v1/me/tutor/edit` | `me/me_003_e_editMyTutorProfile.md` |
| `me_003_edu_c` | `POST /api/v1/me/tutor/education/create` | `me/me_003_edu_c_createTutorEducation.md` |
| `me_003_edu_d` | `DELETE /api/v1/me/tutor/education/:eduId/delete` | `me/me_003_edu_d_deleteTutorEducation.md` |
| `me_003_avail_g` | `GET /api/v1/me/tutor/availability/get` | `me/me_003_avail_g_getTutorAvailability.md` |
| `me_003_avail_e` | `PUT /api/v1/me/tutor/availability/edit` | `me/me_003_avail_e_editTutorAvailability.md` |
| `me_003_req_c` | `POST /api/v1/me/tutor/change-requests/create` | `me/me_003_req_c_createProfileChangeRequest.md` |
| `me_004_g` | `GET /api/v1/me/student/get` | `me/me_004_g_getMyStudentProfile.md` |
| `me_004_e` | `PUT /api/v1/me/student/edit` | `me/me_004_e_editMyStudentProfile.md` |
| `me_004_emergency_e` | `PUT /api/v1/me/student/emergency-contact/edit` | `me/me_004_emergency_e_editStudentEmergencyContact.md` |
| `me_005_c` | `POST /api/v1/me/jobs/create` | `me/me_005_c_createStudentJob.md` |
| `me_005_status_e` | `PUT /api/v1/me/jobs/:jobId/status/edit` | `me/me_005_status_e_editStudentJobStatus.md` |
| `me_005_apps_s` | `POST /api/v1/me/jobs/:jobId/applications/search` | `me/me_005_apps_s_searchJobApplication.md` |
| `me_005_apply_c` | `POST /api/v1/me/jobs/:jobId/apply` | `me/me_005_apply_c_applyStudentJob.md` |
| `me_005_app_status_e` | `PUT /api/v1/me/applications/:applicationId/status/edit` | `me/me_005_app_status_e_editJobApplicationStatus.md` |
| `me_006_c` | `POST /api/v1/me/bookings/create` | `me/me_006_c_createBooking.md` |
| `me_006_s` | `POST /api/v1/me/bookings/search` | `me/me_006_s_searchBooking.md` |
| `me_006_g` | `GET /api/v1/me/bookings/:bookingId/get` | `me/me_006_g_getBooking.md` |
| `me_006_cancel` | `PUT /api/v1/me/bookings/:bookingId/cancel` | `me/me_006_cancel_cancelBooking.md` |
| `me_007_s` | `POST /api/v1/me/bookings/:bookingId/sessions/search` | `me/me_007_s_searchClassSession.md` |
| `me_007_start` | `POST /api/v1/me/sessions/:sessionId/start` | `me/me_007_start_startClassSession.md` |
| `me_007_complete` | `POST /api/v1/me/sessions/:sessionId/complete` | `me/me_007_complete_completeClassSession.md` |
| `me_007_confirm` | `POST /api/v1/me/sessions/:sessionId/confirm-attendance` | `me/me_007_confirm_confirmSessionAttendance.md` |
| `me_007_dispute` | `POST /api/v1/me/sessions/:sessionId/dispute` | `me/me_007_dispute_disputeClassSession.md` |
| `me_008_tutors_s` | `POST /api/v1/me/recommendations/tutors/search` | `me/me_008_tutors_s_searchRecommendedTutor.md` |
| `me_008_jobs_s` | `POST /api/v1/me/recommendations/jobs/search` | `me/me_008_jobs_s_searchRecommendedJob.md` |
| `me_008_feedback_c` | `POST /api/v1/me/recommendations/feedback/create` | `me/me_008_feedback_c_createRecommendationFeedback.md` |
| `me_009_s` | `POST /api/v1/me/invoices/search` | `me/me_009_s_searchInvoice.md` |
| `me_009_g` | `GET /api/v1/me/invoices/:invoiceId/get` | `me/me_009_g_getInvoice.md` |
| `me_009_slip_c` | `POST /api/v1/me/invoices/:invoiceId/slip/upload` | `me/me_009_slip_c_uploadInvoiceSlip.md` |
| `me_010_conv_s` | `POST /api/v1/me/conversations/search` | `me/me_010_conv_s_searchConversation.md` |
| `me_010_conv_c` | `POST /api/v1/me/conversations/create` | `me/me_010_conv_c_createConversation.md` |
| `me_010_msg_s` | `POST /api/v1/me/conversations/:conversationId/messages/search` | `me/me_010_msg_s_searchMessage.md` |
| `me_010_msg_c` | `POST /api/v1/me/conversations/:conversationId/messages/create` | `me/me_010_msg_c_createMessage.md` |
| `me_010_read` | `PUT /api/v1/me/conversations/:conversationId/read` | `me/me_010_read_readConversation.md` |
| `me_010_msg_d` | `DELETE /api/v1/me/messages/:messageId/delete` | `me/me_010_msg_d_deleteMessage.md` |
| `me_011_c` | `POST /api/v1/me/sessions/:sessionId/reviews/create` | `me/me_011_c_createReview.md` |
| `me_011_s` | `POST /api/v1/me/reviews/search` | `me/me_011_s_searchMyReview.md` |

### admin

| Code | Method & path | Doc |
| --- | --- | --- |
| `adm_001_s` | `POST /api/v1/admin/tutors/verification/search` | `admin/adm_001_s_searchTutorVerification.md` |
| `adm_001_verify` | `PUT /api/v1/admin/tutors/:tutorId/verify` | `admin/adm_001_verify_verifyTutorProfile.md` |
| `adm_002_s` | `POST /api/v1/admin/change-requests/search` | `admin/adm_002_s_searchChangeRequest.md` |
| `adm_002_resolve` | `PUT /api/v1/admin/change-requests/:requestId/resolve` | `admin/adm_002_resolve_resolveChangeRequest.md` |
| `adm_003_c` | `POST /api/v1/admin/subjects/create` | `admin/adm_003_c_createSubject.md` |
| `adm_003_e` | `PUT /api/v1/admin/subjects/:subjectId/edit` | `admin/adm_003_e_editSubject.md` |
| `adm_004_s` | `POST /api/v1/admin/invoices/commission/search` | `admin/adm_004_s_searchCommissionInvoice.md` |
| `adm_004_verify` | `PUT /api/v1/admin/invoices/:invoiceId/verify-slip` | `admin/adm_004_verify_verifyInvoiceSlip.md` |
| `adm_005_s` | `POST /api/v1/admin/disputes/search` | `admin/adm_005_s_searchDispute.md` |
| `adm_005_resolve` | `PUT /api/v1/admin/disputes/:disputeId/resolve` | `admin/adm_005_resolve_resolveDispute.md` |
| `adm_006_suspend` | `PUT /api/v1/admin/users/:userId/suspend` | `admin/adm_006_suspend_suspendUser.md` |

### template

| Code        | Method & path                                        | Doc                                                                    |
| ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `tmp_001_c` | `POST /api/v1/template/example/create`               | [`tmp_001_c_createExample.md`](template/tmp_001_c_createExample.md)    |
| `tmp_001_d` | `DELETE /api/v1/template/example/:exampleId/delete`  | [`tmp_001_d_deleteExample.md`](template/tmp_001_d_deleteExample.md)    |
| `tmp_001_e` | `PUT /api/v1/template/example/:exampleId/edit`       | [`tmp_001_e_editExample.md`](template/tmp_001_e_editExample.md)        |
| `tmp_001_g` | `GET /api/v1/template/example/:exampleId/get`        | [`tmp_001_g_getExample.md`](template/tmp_001_g_getExample.md)          |
| `tmp_001_s` | `POST /api/v1/template/example/search`               | [`tmp_001_s_searchExample.md`](template/tmp_001_s_searchExample.md)    |
