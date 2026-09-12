# Requester Rich Presence

Status: implemented; local verification passed; Discord live acceptance pending configuration

## Goal

Cho người dùng liên kết Discord OAuth2 rồi hiển thị bài họ yêu cầu trên profile trong lúc bot phát nhạc.

## Scope

- OAuth2 PKCE với scope `openid sdk.social_layer_presence`.
- Token, state và Gateway session chỉ giữ trong bộ nhớ; restart bot cần liên kết lại.
- Một kết nối Gateway cho mỗi người đã liên kết.
- Cập nhật RPC khi bắt đầu/tạm dừng/tiếp tục bài; xóa khi dừng hoặc hết hàng đợi.
- Không thêm database, framework HTTP hoặc abstraction dự phòng.

## Phases

| Phase | Status | Description |
|---|---|---|
| [01](phase-01-oauth-and-user-gateway.md) | complete | OAuth callback và user Gateway |
| [02](phase-02-music-integration-and-verification.md) | implemented | Lệnh RPC, music hooks, tests và tài liệu; live acceptance pending |

## Dependencies

- Discord application bật Public Client và Social SDK.
- `RPC_REDIRECT_URI` khớp Redirect URL trong Developer Portal.
- Node.js 22 WebSocket/fetch và HTTP chuẩn; không thêm npm dependency.

## Known ceiling

In-memory sessions phù hợp PoC một tiến trình. Cần encrypted persistent token store và refresh flow khi triển khai lâu dài hoặc nhiều instance.

## Verification / handoff

- Build, typecheck and 99 tests passed, including real loopback WebSocket transport tests.
- No subagent tool available: implementation review/testing performed by main agent; no independent agent sign-off claimed.
- RPC config stays in `src/rpc/requester-rpc.ts` so command loading/tests do not import bot secrets.
- Added `oauth-state.ts` and `music-presence.ts` to keep modules below 200 lines.
- Pending: configure Social SDK/Public Client + redirect, deploy `/rpc`, and verify OAuth/profile on Discord.
