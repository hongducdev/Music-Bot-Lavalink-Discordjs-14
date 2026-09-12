# Quy ước đóng góp

## Commit message

Mọi commit dùng **gitmoji + Conventional Commits + tiếng Anh**:

```
<gitmoji> <type>(<scope>): <mô tả ngắn>
```

| Gitmoji | Type | Dùng khi |
|---|---|---|
| ✨ | `feat` | thêm tính năng |
| 🐛 | `fix` | sửa lỗi |
| ✅ | `test` | thêm/sửa test |
| 📝 | `docs` | chỉ sửa tài liệu |
| ♻️ | `refactor` | đổi cấu trúc, không đổi hành vi |
| ⚡ | `perf` | tối ưu hiệu năng |
| 🔧 | `chore` | cấu hình, dependency |
| 🚨 | `style` | format, lint |
| 🔒 | `security` | vá bảo mật |

Quy tắc:

- Subject **≤ 72 ký tự**, thể mệnh lệnh ở hiện tại (`add`, không phải `added`), không có dấu chấm cuối.
- Viết **tiếng Anh**. `scope` là mảng việc: `embeds`, `commands`, `status`, `lavalink`, `readme`…
- Body (tuỳ chọn) là gạch đầu dòng, nói **vì sao** thay vì kể lại code.
- **Chia nhỏ theo scope**, không gộp `feat` + `fix` + `docs` vào một commit. Sắp thứ tự sao cho commit sau chỉ phụ thuộc commit trước.
- Không thêm attribution của AI (`Generated with…`, `Co-Authored-By: …`).

Ví dụ:

```
✨ feat(messages): restyle embeds and auto-delete noisy replies
🐛 fix(lavalink): hint on 401 and keep start.ps1 errors visible
📝 docs(readme): document help, auto-delete and lavalink auth fix
```

## Trước khi commit

Chạy và phải sạch cả hai:

```powershell
npx tsc --noEmit
npm test
```

Kiểm tra không lộ secret (`.env` đã bị git ignore — đừng bao giờ `git add -f`):

```powershell
git diff --cached
git diff --cached --name-only | Select-String "^\.env$"
```

Với thay đổi nhiều file, kiểm tra **từng commit** vẫn biên dịch được:

```powershell
git log --oneline origin/main..HEAD   # xem các commit sap push
git checkout <sha>; npx tsc --noEmit; git checkout main
```
