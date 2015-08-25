# HomeGate

Đây là Nodejs Project thực thi chức năng chủa homegate trong ứng dụng SmartHome. 

## Các chức năng của HomeGate bao gồm:

##### Authentication dựa trên Access Token.
##### Quản lý thiết bị:
   * Cho phép add/remove các Device (thiết bị bị điều khiển) vào một "Cây quản lý". Nút lá của Cây quản lý là Device. Các nút giữa, nút trong là Group (Nhóm các thiết bị). Cây quản lý được triển khai theo mô hình "Nested Set Model" trên SQLite3.
   * Query các thiết bị theo: Tên (Nhóm, Thiết bị), ID (Nhóm, Thiết bị), prefix Tên.
   * API là HTTP/JSON.
   
##### Thông tin chi tiết của 1 Device (Thiết bị bị điều khiển):
   - Name, Description, Type, Endpoint.

## Cấu trúc Project:

- home.js: file chạy chính, thực thi logic của homegate server
- package.json: package dependency description
- mydb.db: file CSDL SQLite mẫu.

## Cấu trúc database mydb.db
- 3 tables: group, device, và user

## Homegate API:

#### Init cơ sở dữ liệu mẫu:
  + URL: ```http://<host>:<port>/api/init```
  + Method: ```POST```
  + Parameter: ```NONE```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', message: 'thông báo'}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Thay đổi mật khẩu người dùng:
  + URL: ```http://<host>:<port>/api/changepass```
  + Method: ```POST```
  + Body: ```user=<Tên người dùng>, password=<Mật khẩu cũ>, newpass=<Mật khẩu mới>```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', message: 'thông báo'}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Authentication:
  + URL: ```http://<host>:<port>/api/auth```
  + Method: ```POST```
  + Body: ```user=<Tên người dùng>, password=<Mật khẩu plain text>```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', token: <mã token>}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Tạo thiết bị:
  + URL: ```http://<host>:<port>/api/device```
  + Method: ```POST```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json```
  + Parameter: ```NONE```
  + Body: ```JSON object Device cần tạo. {name: <name>, descrip: <description>, type: <type>, endpoint: <endpoint>, parent: <parent>}```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', device: [{<thông tin thiết bị được tạo>}]}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Truy vấn thông tin thiết bị:
  + URL: ```http://<host>:<port>/api/device/<arg> (arg: id hoặc tên thiết bị. Arg = '': query tất cả Device)```
  + Method: ```GET```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>```
  + Parameter: ```NONE```
  + Response:
	 * Trường hợp thành công: ```{ success: 'true', devices: [ {<thông tin thiết bị 1>}```, {<thông tin thiết bị 2>}```, ...] }```
	 * Trường hợp không thành công: ```{success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Cập nhật / Sửa đổi thiết bị:
  + URL: ```http://<host>:<port>/api/device```
  + Method: ```PUT```
  + Custom header: x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json
  + Parameter: ```NONE```
  + Body: JSON object Device cần cập nhật (Chú ý: bắt buộc phải có trường id để có thể cập nhật chính xác thiết bị). ```{id: <id>, name: <name>, descrip: <description>, type: <type>, endpoint: <endpoint>, parent: <parent>}```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', device: [{<thông tin thiết bị đã cập nhật>}]}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Xóa thiết bị:
  + URL: ```http://<host>:<port>/api/device/<arg> (arg: id hoặc tên thiết bị)```
  + Method: ```DELETE```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>```
  + Parameter: ```NONE```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', device: [{<thông tin thiết bị đã xóa>}]}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Tạo nhóm:
  + URL: ```http://<host>:<port>/api/group```
  + Method: ```POST```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json```
  + Parameter: ```NONE```
  + Body: JSON object Group cần tạo. ```{name: <name>, descrip: <description>, parent: <parent>}```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', group: [{<thông tin group được tạo>}]}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Truy vấn thông tin nhóm:
  + URL: ```http://<host>:<port>/api/group/<custom>/<arg> (arg: id hoặc tên nhóm. Arg = '': query tất cả Group)```
  + Method: ```GET```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>```
  + Parameter: ```NONE```
  + Tham số ```<custom>```:
  	* ```subdev```: Thông tin nhóm trả về bao gồm các thiết bị con.
  	* ```subgrp```: Thông tin nhóm trả về bao gồm các nhóm con.
  	* ```suball```: Thông tin nhóm trả về bao gồm cả thiết bị con lẫn các nhóm con.
  + Response:
	 * Trường hợp thành công: ```{ success: 'true', group: {<thông tin nhóm dạng cây>}}```
	 * Trường hợp không thành công: ```{success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Truy vấn thông tin nhóm:
  + URL: ```http://<host>:<port>/api/group/<arg> (arg: id hoặc tên nhóm. Arg = '': query tất cả Group)```
  + Method: ```GET```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>```
  + Parameter: ```NONE```
  + Response:
	 * Trường hợp thành công: ```{ success: 'true', group: {<thông tin nhóm dạng cây>}}```
	 * Trường hợp không thành công: ```{success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Cập nhật / Sửa đổi nhóm:
  + URL: ```http://<host>:<port>/api/group```
  + Method: ```PUT```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>, Content-Type: application/json```
  + Parameter: ```NONE```
  + Body: JSON object Group cần cập nhật (Chú ý: bắt buộc phải có trường id để có thể cập nhật chính xác nhóm). ```{id: <id>, name: <name>, descrip: <description>}```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', group: [{<thông tin nhóm đã cập nhật>}]}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```

#### Xóa nhóm:
  + URL: ```http://<host>:<port>/api/group/<arg> (arg: id hoặc tên nhóm)```
  + Method: ```DELETE```
  + Custom header: ```x-access-token: <token có được sau khi authentication thành công>```
  + Parameter: ```NONE```
  + Response:
	* Trường hợp thành công: ```{ success: 'true', group: [{<thông tin nhóm đã xóa>}]}```
	* Trường hợp không thành công: ```{ success: 'false', message: 'Nguyên nhân thất bại.' }```
