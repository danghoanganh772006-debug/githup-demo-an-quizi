# DE35 Quiz - Website thi trắc nghiệm

Ứng dụng web tiếng Việt cho phép chọn đề thi, làm bài từng câu, chấm điểm tự động và xem đáp án chi tiết. Stack chạy bằng Docker Compose: Node.js/Express, MySQL, phpMyAdmin, Nginx reverse proxy, Prometheus, Grafana, Loki và Promtail.

## Kiến trúc

```text
Browser --HTTPS--> Nginx --> Quiz app --> MySQL
                         Prometheus <-- app / Nginx exporter / MySQL exporter / cAdvisor
                         Grafana --> Prometheus + Loki
Docker logs --> Promtail --> Loki
phpMyAdmin -----------------------> MySQL
```

Các mạng Docker `frontend`, `backend` và `monitoring` được tách riêng. MySQL không publish port ra host; phpMyAdmin, Prometheus và Grafana chỉ bind vào loopback. Ứng dụng chạy non-root, filesystem read-only, drop capabilities và bật `no-new-privileges`.

## Yêu cầu

- Windows 10/11, Docker Desktop ở chế độ Linux containers.
- Git nếu muốn push mã nguồn lên GitHub.
- RAM khuyến nghị từ 8 GB cho toàn bộ stack monitoring.

## Chạy ứng dụng

Mở PowerShell tại thư mục dự án, tạo cấu hình riêng và thay toàn bộ mật khẩu mẫu bằng mật khẩu mạnh, khác nhau:

```powershell
Copy-Item .env.example .env
notepad .env
```

Tạo chứng chỉ tự ký cho máy local (không dùng trong production):

```powershell
New-Item -ItemType Directory -Force nginx/certs
docker run --rm -v "${PWD}/nginx/certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/quiz.key -out /certs/quiz.crt -subj "/CN=localhost"
```

Kiểm tra cấu hình rồi khởi chạy:

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail=100
```

Đợi MySQL và ứng dụng khởi động xong. Trình duyệt sẽ cảnh báo chứng chỉ không tin cậy do chứng chỉ tự ký; chỉ tiếp tục trên môi trường local.

## Địa chỉ dịch vụ

| Thành phần | Địa chỉ |
|---|---|
| Website Quiz | https://localhost:8444 |
| HTTP chuyển sang HTTPS | http://localhost:8083 |
| Health check | https://localhost:8444/health |
| phpMyAdmin | http://127.0.0.1:8082 |
| Prometheus | http://127.0.0.1:9091 |
| Grafana | http://127.0.0.1:3001 |

Trong phpMyAdmin, kết nối host `mysql`, port `3306`, tài khoản `MYSQL_USER` và mật khẩu `MYSQL_PASSWORD`. Dữ liệu khởi tạo nằm trong `database/init.sql`; schema gồm `quiz_sets`, `questions`, `choices`, `users`, `attempts` và `attempt_answers`.

## Làm bài

1. Tại trang chủ, nhập tên học viên và chọn **Làm bài** ở đề muốn thi.
2. Chọn đáp án, dùng **Trước/Tiếp theo** để di chuyển qua từng câu.
3. Nộp bài để xem điểm trên thang 100 và đáp án đúng/sai chi tiết.
4. Kết quả và câu trả lời được lưu vào MySQL.

## Giám sát và log

Prometheus lấy metrics từ ứng dụng, Nginx exporter, MySQL exporter và cAdvisor. Dashboard `DTC245200430 - Quiz System` được provision tự động trong Grafana. Sau khi có bài nộp, thử các truy vấn Prometheus:

```promql
up
quiz_attempts_total
quiz_average_score
container_memory_working_set_bytes{name=~".*quiz.*"}
```

Trong Grafana → **Explore** → datasource **Loki**, có thể lọc log bằng LogQL:

```logql
{container=~".*quiz.*"}
{service="app"}
{container=~".*quiz-app.*"} |= "quiz_submission"
```

## GitHub

Workflow tại `.github/workflows/validate.yml` kiểm tra cú pháp Node.js và cấu hình Docker Compose trên mỗi push/pull request. Trước khi push, kiểm tra trạng thái Git và không đưa `.env`, chứng chỉ riêng, private key hay thông tin đăng nhập lên GitHub:

```powershell
git init
git add .
git status --short
git commit -m "feat: deploy DE35 quiz system"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

Tạo repository GitHub trước và thay `<username>/<repository>` bằng địa chỉ repository của bạn. Nên đặt repository private nếu có thông tin cá nhân.

## Hardening và lưu ý

- Đổi tất cả mật khẩu trong `.env`; file này được Git ignore.
- Nginx chuyển HTTP sang HTTPS, chỉ bật TLS 1.2/1.3, ẩn phiên bản, giới hạn request và thêm security headers.
- phpMyAdmin, Prometheus và Grafana chỉ bind `127.0.0.1`; MySQL không mở cổng ra host.
- TLS certificate là chứng chỉ tự ký cho local, không phải chứng chỉ production.
- Promtail đọc Docker socket để phát hiện container; socket vẫn là tài nguyên nhạy cảm dù mount chỉ đọc.
- cAdvisor chạy `privileged` và đọc một số đường dẫn host để lấy metrics. Đây là ngoại lệ phục vụ bài lab monitoring, cần cân nhắc trước khi triển khai production.

## Dừng dịch vụ

```powershell
docker compose down
```

Xóa toàn bộ volume (bao gồm dữ liệu thi và dashboard) chỉ khi bạn chủ ý reset:

```powershell
docker compose down -v
```
