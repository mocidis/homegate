# homegate

Day la node js project thuc thi chuc nang homegate trong ung dung Smarthome. 

* Cac chuc nang homegate bao gom:

- Authentication dua tren access token 
- Quan ly thiet bi:
   + Cho phep add/remove cac device (thiet bi bi dieu khien) vao mot "cay quan ly". Nut la cua cay quan ly la device. Cac nut giua la cac nhom. Cay quan ly duoc thuc hien bang "nested set model" tren SQLite3.
   + Query cac thiet bi theo: Ten (nhom, thiet bi), ID (nhom, thiet bi)
   + API la HTTP/JSON
- Thong chi tiet cua 1 thiet bi bao gom: Name, Description, type, endpoint

* Cau truc project:

- home.js: file chay chinh, thuc thi logic cua homegate server
- package.json: package dependency description
- mydb.db: file CSDL SQLite mau.

* Cau truc database mydb.db
- 3 tables: group, device, and password

* Homegate API:
- Authentication: http://<host>:<port>/api/auth
  + Method: POST
  + Parameter: key=\<mat khau plaintext cua user\>
  + Response: 
     % truong hop thanh cong {success: 'true', token: <ma token>}
     % truong hop khong thanh cong {success: 'false' }

- query thiet bi: http://<host>:<port>/api/device/<arg> (arg: id hoac name thiet bi. Arg = '': query all devices)
  + Method: GET
  + Custom header: x-access-token: <token co duoc sau khi authentication thanh cong>
  + Parameter: NONE
  + Response: 
     % truong hop thanh cong: { success: 'true', devices: [ {<thong tin thiet bi 1>}, {<thong tin thiet bi 2>}, ...] }
     % truong hop khong thanh cong {success: 'false', message: "reason for failure }

- tao thiet bi: 
