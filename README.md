# HomeGate

Đây là Nodejs Project thực thi chức năng chủa homegate trong ứng dụng SmartHome. 

## Các chức năng của HomeGate bao gồm:

- Authentication dựa trên Access Token
- Quản lý thiết bị:
   + Cho phép add/remove các Device (thiết bị bị điều khiển) vào một "Cây quản lý". Nút lá của Cây quản lý là Device. Các nút giữa, nút trong là Group (Nhóm các thiết bị). Cây quản lý được triển khai theo mô hình "Nested Set Model" trên SQLite3.
   + Query các thiết bị theo: Tên (Nhóm, Thiết bị), ID (Nhóm, Thiết bị), prefix Tên.
   + API là HTTP/JSON
- Thông tin chi tiết của 1 Device (Thiết bị bị điều khiển): Name, Description, Type, Endpoint

## Cấu trúc Project:

- home.js: file chạy chính, thực thi logic của homegate server
- package.json: package dependency description
- mydb.db: file CSDL SQLite mẫu.

## Cấu trúc database mydb.db
- 3 tables: group, device, và password

## Homegate API:
- Authentication: http://<host>:<port>/api/auth
  + Method: POST
  + Parameter: key=<Mật khẩu plain text của user>
  + Response: 
	++ Trường hợp thành công: { success: 'true', token: <ma token>}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }

- Tạo thiết bị: http://<host>:<port>/api/device
  + Method: POST
  + Custom header: x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json
  + Parameter: NONE
  + Body: JSON object Device cần tạo. {name: <name>, descrip: <description>, type: <type>, endpoint: <endpoint>, parent: <parent>}
  + Response:
	++ Trường hợp thành công: { success: 'true', device: [{<thông tin thiết bị được tạo>}]}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }

- Truy vấn thông tin thiết bị: http://<host>:<port>/api/device/<arg> (arg: id hoặc name thiết bị. Arg = '': query tất cả Device)
  + Method: GET
  + Custom header: x-access-token: <token có được sau khi authentication thành công>
  + Parameter: NONE
  + Response: 
	 ++ Trường hợp thành công: { success: 'true', devices: [ {<thông tin thiết bị 1>}, {<thông tin thiết bị 2>}, ...] }
	 ++ Trường hợp không thành công: {success: 'false', message: 'reason for failure' }

- Cập nhật / Sửa đổi thiết bị: http://<host>:<port>/api/device/
  + Method: PUT
  + Custom header: x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json
  + Parameter: NONE
  + Body: JSON object Device cần cập nhật (Chú ý: bắt buộc phải có trường id để có thể cập nhật chính xác thiết bị). {id: <id>, name: <name>, descrip: <description>, type: <type>, endpoint: <endpoint>, parent: <parent>}
  + Response:
	++ Trường hợp thành công: { success: 'true', device: [{<thông tin thiết bị đã cập nhật>}]}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }

- Xóa thiết bị: http://<host>:<port>/api/device/<arg> (arg: id hoặc name thiết bị)
  + Method: DELETE
  + Custom header: x-access-token: <token có được sau khi authentication thành công>
  + Parameter: NONE
  + Response:
	++ Trường hợp thành công: { success: 'true', device: [{<thông tin thiết bị đã xóa>}]}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }

- Tạo nhóm: http://<host>:<port>/api/group
  + Method: POST
  + Custom header: x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json
  + Parameter: NONE
  + Body: JSON object Group cần tạo. {name: <name>, descrip: <description>, parent: <parent>}
  + Response:
	++ Trường hợp thành công: { success: 'true', group: [{<thông tin group được tạo>}]}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }

- Truy vấn thông tin nhóm: http://<host>:<port>/api/group/<arg> (arg: id hoặc name nhóm. Arg = '': query tất cả Group)
  + Method: GET
  + Custom header: x-access-token: <token có được sau khi authentication thành công>
  + Parameter: NONE
  + Response: 
	 ++ Trường hợp thành công: { success: 'true', group: {<thông tin thiết bị dạng cây>} }
	 ++ Trường hợp không thành công: {success: 'false', message: 'reason for failure' }

- Cập nhật / Sửa đổi nhóm: http://<host>:<port>/api/group/
  + Method: PUT
  + Custom header: x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json
  + Parameter: NONE
  + Body: JSON object Group cần cập nhật (Chú ý: bắt buộc phải có trường id để có thể cập nhật chính xác nhóm). {id: <id>, name: <name>, descrip: <description>}
  + Response:
	++ Trường hợp thành công: { success: 'true', group: [{<thông tin nhóm đã cập nhật>}]}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }

- Xóa nhóm: http://<host>:<port>/api/group/<arg> (arg: id hoặc name nhóm)
  + Method: DELETE
  + Custom header: x-access-token: <token có được sau khi authentication thành công>
  + Parameter: NONE
  + Response:
	++ Trường hợp thành công: { success: 'true', group: [{<thông tin nhóm đã xóa>}]}
	++ Trường hợp không thành công: { success: 'false', message: 'reason for failure' }
