-- Migration: Import DigiKhata legacy bills data
-- 871 bills from DigiKhata PDF bill report

INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (1, 6, '2026-03-20', 'Faisal G 05 Venus Mobile', '03227474720', FALSE, '355cb734-3a4e-4fce-a877-009255c879b3', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official', 'Faisal G 05 Venus Mobile
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (2, 5, '2026-03-20', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official; pixel 7a official', 2, 183000, '128GB', NULL, 'Official', 'Waqar G 7 Fazal Centre
pixel 8 pro 128gb official 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (3, 4, '2026-03-19', 'Fahad Butt G 07', '03224011666', FALSE, '28d138a9-5124-4dc1-90f4-915eff14c71e', 'Samsung', 'S 26 ultra', 'S 26 ultra', 1, 497000, NULL, NULL, NULL, 'Fahad Butt G 07
S 26 ultra 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (4, 3, '2026-03-18', 'Arshad Sb S 25 Ultra', '03214582007', FALSE, '0ecaa0de-d86a-46da-823a-3ff637491b75', 'Samsung', 's 25 ultra', 's 25 ultra', 1, 255000, NULL, '350712881796292', 'Brand new/Box pack; PTA Approved', 'Arshad Sb S 25 Ultra
brand new 350712881796292
online approved
s 25 ultra 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (5, 2, '2026-03-17', 'Fazal Abbas Noorka 4a 5g', '03008400069', FALSE, '96c88206-0bc6-4655-8a39-a32881660dbf', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 51000, NULL, NULL, 'Official; 3 days check warranty', 'Fazal Abbas Noorka 4a 5g
Buyer
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (6, 1, '2026-03-17', 'Hamza Pixel 7a', '03058400056', FALSE, 'cb936fb9-031c-4fe9-b016-fcac64123f5a', 'Google', 'pixel 7a official', 'pixel 7a official x2', 2, 104000, NULL, NULL, 'Official; 3 days check warranty; Discount: 1k
discount', 'Hamza Pixel 7a
3 days check warranty for
battery and software 1k
discount
pixel 7a official 2 pcs', 'WARNING', 'Multi-qty (2 pcs) — per-unit price unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (7, 208, '2026-03-17', 'Zaid G 6 Fazal Trade Centre', '03004101021', FALSE, 'ba3cd72e-c413-4fb7-a6f3-8714935e67bf', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 47000, NULL, NULL, 'Official', 'Zaid G 6 Fazal Trade Centre
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (8, 207, '2026-03-16', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 50000, NULL, NULL, 'Official', 'Haris
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (9, 206, '2026-03-16', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', 'Google', 'pixel 6a cpid', 'pixel 6a cpid', 1, 36000, NULL, NULL, 'CPID', 'Hanzala Iftikhar
pixel 6a cpid 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (10, 205, '2026-03-16', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 48000, NULL, NULL, 'Official', 'Ali Rana
Tower
✨   Sarwar G 15 IT
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (11, 204, '2026-03-16', 'Waleed Phone Wrap', '03001111190', FALSE, '6bab263d-c998-4360-ada1-c15df59a7992', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official', 'Waleed Phone Wrap
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (12, 203, '2026-03-16', 'Alizeb Mobiles', '03219191915', FALSE, '83bc6371-365a-4c89-af47-e97af0572968', 'Google', 'pixel 7', 'pixel 7', 1, 62000, '256GB', NULL, 'Official', 'Alizeb Mobiles
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (13, 202, '2026-03-16', 'Talha Pixel 9 Pro Xl Official', '03081979589', FALSE, 'edcb14ae-9b98-4abd-8bc4-a8f275b91bc7', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 193000, NULL, NULL, 'Official', 'Talha Pixel 9 Pro Xl Official
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (14, 201, '2026-03-16', 'Adil Pixel 6a Cpid', '03234564366', FALSE, '00a5eece-bf62-48eb-8aea-c1a1756bbad9', 'Google', 'pixel 6a cpid', 'pixel 6a cpid', 1, 36000, NULL, NULL, 'CPID; 3 days check warranty', 'Adil Pixel 6a Cpid
3 days check warranty for
battery and software
pixel 6a cpid 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (15, 200, '2026-03-16', 'Osama Pixel 6 Pro Official', '03152066667', FALSE, 'a21750be-59f6-489c-b4fe-82ef0a22e896', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 71000, NULL, NULL, 'Official; 3 days check warranty', 'Osama Pixel 6 Pro Official
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (16, 199, '2026-03-14', 'Arkham Pixel 6 Pro Dgk', '0331728879', FALSE, '545fda95-796c-4266-9b32-a1913f917d5c', 'Google', 'cables', 'cables; chargers; pixel 6 pro official', 3, 80000, NULL, NULL, 'Official', 'Arkham Pixel 6 Pro Dgk
cables 1 pcs
chargers 1 pcs
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (17, 197, '2026-03-13', 'Malik Zain Pixel 7 White', '03004285851', FALSE, '5334f185-57a1-4943-8038-d51f49ede9dd', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', '351870910627729', 'Official; 3 days check warranty', 'Malik Zain Pixel 7 White
3 days check warranty for
battery and software
351870910627729
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (18, 196, '2026-03-13', 'S Ahmad Pixel 8 Pro Seller', '03099547457', FALSE, '28b5e44b-30f9-4f92-a399-cd6e18e87198', 'Google', 'buds pro 2', 'buds pro 2 x2', 2, 49200, NULL, NULL, NULL, 'S Ahmad Pixel 8 Pro Seller
Gujranwala
buds pro 2 2 pcs', 'WARNING', 'Multi-qty (2 pcs) — per-unit price unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (19, 195, '2026-03-11', 'Mohammed Pixel 7a White', '03418724420', FALSE, 'f0c06e31-5ab7-4dd1-aeac-129ad996e240', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Mohammed Pixel 7a White
Official
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (20, 194, '2026-03-11', 'Shoaib Pixel 7a Official Shade', '03020110341', FALSE, '19bf98d6-249b-425a-8057-9e20e47661b5', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 49500, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Shoaib Pixel 7a Official Shade
3 days check warranty for
battery and software official
PTA approved
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (21, 193, '2026-03-10', 'Ikram Sb Pixel 9 Pro XL', '03004243208', FALSE, 'bc74c6d5-3cdc-49fb-afe2-f14247ee7111', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL x2; cables x3; chargers x2', 7, 411000, NULL, NULL, 'Official; 3 days check warranty; Discount: 5k
discount', 'Ikram Sb Pixel 9 Pro XL
3 days check warranty for
battery and software 5k
discount 406k official PTA
approved
Pixel 9 pro XL 2 pcs
cables 3 pcs
chargers 2 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (22, 192, '2026-03-10', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, NULL, NULL, 0, 140000, NULL, NULL, NULL, 'Hanzala Iftikhar', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (23, 191, '2026-03-11', 'Husnain Pixel 8 Official', '03070008837', FALSE, '232a8ba7-e139-49e4-8c23-7f8e3cac4646', 'Google', 'pixel 8', 'pixel 8', 1, 66000, '256GB', NULL, 'Official; 3 days check warranty', 'Husnain Pixel 8 Official
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (24, 190, '2026-03-10', 'Asif S 25 Ultra Official PTA', '03224433222', FALSE, 'f5c859e4-4693-4d17-9cd4-5d55a2ed26d3', 'Samsung', 's 25 ultra', 's 25 ultra', 1, 315000, NULL, '351636250258841', 'Official; PTA Approved', 'Asif S 25 Ultra Official PTA
Approved
OFFICIAL PTA APPROVED
351636250258841
s 25 ultra 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (25, 188, '2026-03-09', 'Faizan Pixel 7a Official Black', '03281166590', FALSE, 'dfe3d973-458f-4bbd-a191-fdf2c51651fb', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Faizan Pixel 7a Official Black
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (26, 187, '2026-03-09', 'Adnan 7a Official PTA Blue', '03266090909', FALSE, 'd18d16e8-4b30-4e84-b0e6-4c4aa4562006', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 55000, NULL, NULL, 'Official; 3 days check warranty', 'Adnan 7a Official PTA Blue
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (27, 186, '2026-03-07', 'Waqar 10pro XL Monnstone', '03306060696', FALSE, '7f194b69-b7a4-487f-b4ae-6e113df9b13e', 'Google', 'pixel 10 pro xl', 'pixel 10 pro xl', 1, 240000, NULL, NULL, '3 days check warranty', 'Waqar 10pro XL Monnstone
3 days check warranty for
battery and software
pixel 10 pro xl 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (28, 185, '2026-03-07', 'Faizan Raja Mobile IT Tower', '03213617777', FALSE, '9a1b6f28-3e69-41e6-9ddb-ec4f443fea51', 'Google', 'Pixel 10 pro', 'Pixel 10 pro', 1, 280000, NULL, NULL, NULL, 'Faizan Raja Mobile IT Tower
Pixel 10 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (29, 184, '2026-03-06', 'Ghaffar Sb Rajanpur 8a', '03414272981', FALSE, '461c8b52-2cda-465e-a0a3-33551ee96eef', 'Google', 'pixel 8a', 'pixel 8a', 1, 78000, NULL, NULL, '3 days check warranty', 'Ghaffar Sb Rajanpur 8a
3 days check warranty for
battery and software
pixel 8a 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (30, 183, '2026-03-05', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 51500, NULL, NULL, 'Official; 3 days check warranty', 'Adnan MZ Mobile
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (31, 182, '2026-03-04', 'Noman Pixel 6 Official Black', '03459438206', FALSE, '58530d96-f785-4a46-9d84-9ee1c6feb254', 'Google', 'pixel 6', 'pixel 6', 1, 60000, NULL, NULL, 'Official; 3 days check warranty', 'Noman Pixel 6 Official Black
3 days check warranty for
battery and software
pixel 6 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (32, 181, '2026-03-02', 'Shazad 9proxl', NULL, TRUE, 'ba5532ef-2157-4764-96b0-7b1be39aa6e4', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 200000, NULL, NULL, '3 days check warranty', 'Shazad 9proxl
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (33, 180, '2026-03-02', 'Hashim OnePlus 13t', '03245001160', FALSE, 'a692782c-0799-4083-99e0-ed7caf08b19c', 'OnePlus', 'OnePlus 13t', 'OnePlus 13t', 1, 150000, NULL, NULL, '3 days check warranty', 'Hashim OnePlus 13t
3 days check warranty for
battery and software
OnePlus 13t 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (34, 179, '2026-02-28', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official', 'Waqar G 7 Fazal Centre
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (35, 178, '2026-02-28', 'Usman Bonton Mobile 123', '03218888366', FALSE, '53a1ef52-935d-4110-bcbd-689cc4670d33', 'Google', 'pixel 9', 'pixel 9', 1, 122000, NULL, NULL, NULL, 'Usman Bonton Mobile 123
Hafeez Centre
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (36, 177, '2026-02-28', 'Skiandr 9proxl CPID Box', '03379853203', FALSE, 'cde387b1-a70c-48d2-997e-dfde2d7389f3', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 168000, NULL, NULL, 'CPID', 'Skiandr 9proxl CPID Box
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (37, 176, '2026-02-28', 'Wajid Pixel 10 Box Pack', '03174105616', FALSE, '30546a1e-3f3a-4248-9eab-4dbdf0b4374d', 'Google', 'Pixel 10', 'Pixel 10', 1, 188000, NULL, NULL, 'Brand new/Box pack', 'Wajid Pixel 10 Box Pack
brand new box pack
Pixel 10 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (38, 175, '2026-02-27', 'M Ahmad 9 Pro XL 512gb', '03130356690', FALSE, 'b5fe944b-4014-4d00-b8fd-26b71bae2487', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 225000, '512GB', NULL, '3 days check warranty', 'M Ahmad 9 Pro XL 512gb
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (39, 174, '2026-02-27', 'Haris OnePlus 13t', '03174223662', FALSE, '84084b17-69dc-4c19-8186-09a0cd2e1877', 'OnePlus', 'OnePlus 13t', 'OnePlus 13t', 1, 137000, NULL, NULL, 'Refurbished; 10 days check warranty', 'Haris OnePlus 13t
10 days check warranty for
battery and software non
refurbished
OnePlus 13t 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (40, 173, '2026-02-27', 'Ashfaq Mahmood Pixel 8', '03018400526', FALSE, '6bb1f3d2-b4f8-4157-b321-365ce7427bd9', 'Google', 'chargers', 'chargers', 1, 93000, '256GB', NULL, 'Official; 3 days check warranty', 'Ashfaq Mahmood Pixel 8
Official
3 days check warranty for
battery and software
chargers 1 pcs
PIXEL 8 official 128gb/256gb
1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (41, 172, '2026-02-24', 'Ramzan Mubarak Buds Pro 1', '03221010640', FALSE, '21133f2c-b0a8-4fe5-a5f5-1bdb2e34db46', 'Google', 'buds pro 1', 'buds pro 1', 1, 14000, NULL, NULL, NULL, 'Ramzan Mubarak Buds Pro 1
Lemon
buds pro 1 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (42, 171, '2026-02-24', 'Nadeem Akram Pixel Seller', '03006880105', FALSE, '726c60a7-80d2-46ad-b722-4d17ec198428', 'Google', 'pixel 9', 'pixel 9', 1, 160000, NULL, NULL, NULL, 'Nadeem Akram Pixel Seller
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (43, 170, '2026-02-24', 'Zain 9 Pro 128gb', '03704986708', FALSE, 'b5df5446-c436-4192-84ad-32dc35f49a32', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 155000, '128GB', NULL, '3 days check warranty', 'Zain 9 Pro 128gb
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (44, 169, '2026-02-24', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', 'Google', 'pixel 10 pro xl', 'pixel 10 pro xl', 1, 280000, NULL, '354416438372344', 'Brand new/Box pack', 'Mudassir Kalpay
BRAND NEW BOX PACK
MOONSTONE COLOUR UK
VARIANT 354416438372344
pixel 10 pro xl 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (45, 168, '2026-02-23', 'Hashaj Pixel 10 Frost', '03174139760', FALSE, '2d0fd70a-76e0-4ae4-8d2e-23f599f6964f', 'Google', 'Pixel 10', 'Pixel 10', 1, 183000, NULL, NULL, '3 days check warranty', 'Hashaj Pixel 10 Frost
3 days check warranty for
battery and software
Pixel 10 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (46, 167, '2026-03-01', 'Syed Ali Murtaza 9proxl', '03315200579', FALSE, '79a654f4-4431-4d49-b4f7-2f6608e51dd1', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 210000, '256GB', NULL, 'Official', 'Syed Ali Murtaza 9proxl
Official 256gb
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (47, 166, '2026-02-23', 'Airaj Pixel 9 Pro 256gb', '03000082234', FALSE, 'df3000d8-8d92-4ee2-8051-51b044ba23b2', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 168000, '256GB', NULL, 'Exchange/Adjustment; Received: 1k recieved', 'Airaj Pixel 9 Pro 256gb
Exchange
pixel 8 256gb with box
adjusted in 85k cash recieved
83k 1k recieved for cable
pixel 9 pro 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (48, 165, '2026-02-21', 'M Ahsan Raza Pixel 9', '03200460403', FALSE, 'e5609bd8-24a8-4d65-89aa-06aaa40e939a', 'Google', 'pixel 9', 'pixel 9', 1, 130000, NULL, NULL, '3 days check warranty', 'M Ahsan Raza Pixel 9
Porcelain
3 days check warranty for
battery and software
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (49, 164, '2026-02-19', 'Pixel 6 Online Approved Black', '03002033374', FALSE, '7affded8-85ff-4d77-8234-f0dc72784ad9', 'Google', 'pixel 6', 'pixel 6', 1, 46000, NULL, NULL, 'PTA Approved; 3 days check warranty', 'Pixel 6 Online Approved Black
tax paid 3 days check
warranty for battery and
software
pixel 6 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (50, 163, '2026-02-18', 'Muzaffar 6a Buyer Teacher', '03333666169', FALSE, 'f6bb23f8-2627-42d6-9f43-74743656f3d2', 'Google', 'pixel 10 pro xl', 'pixel 10 pro xl', 1, 270000, NULL, NULL, 'Exchange/Adjustment; Received: 130k received', 'Muzaffar 6a Buyer Teacher
9 proxl adjusted for 140k 3
days backup for battery and
software 130k received
pixel 10 pro xl 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (51, 162, '2026-02-18', 'Abbas Sb 8a Buyer', '03009403877', FALSE, '94b23c45-3c31-44b8-9e91-749c09fc418c', 'Google', 'pixel 10 pro xl', 'pixel 10 pro xl', 1, 275000, NULL, NULL, NULL, 'Abbas Sb 8a Buyer
pixel 10 pro xl 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (52, 161, '2026-02-18', 'Mian Abdul Rehman Mateen', '03134238196', FALSE, '1bb7af86-6b00-40be-8507-f5dab77ffb22', NULL, NULL, NULL, 0, 225000, '512GB', NULL, 'Official; PTA Approved; Remaining balance: 175k remaining; Received: 50k recieved', 'Mian Abdul Rehman Mateen
Solar Pannels
512gb official PTA approved
50k recieved 175k remaining
balance', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (53, 160, '2026-02-17', 'Salman Pixel 7 256gb', '03244662261', FALSE, '3a8e9a94-8e7d-4b1d-9549-eef653ba5a06', 'Google', 'pixel 7', 'pixel 7', 1, 70000, '256GB', NULL, 'Official', 'Salman Pixel 7 256gb
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (54, 159, '2026-02-17', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'cables', 'cables; chargers; pixel 7a official x2', 4, 109000, NULL, NULL, 'Official', 'Waqar G 7 Fazal Centre
cables 1 pcs
chargers 1 pcs
pixel 7a official 2 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (55, 158, '2026-02-16', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 71000, NULL, NULL, 'Official; 3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (56, 157, '2026-02-16', 'Kamaal Mansha Orient', '03218466422', FALSE, '3b04c4f7-9c8b-4488-94fa-4a1f4a58399a', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 73000, NULL, NULL, 'Official; 3 days check warranty', 'Kamaal Mansha Orient
Electronics
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (57, 156, '2026-02-16', 'Noman Pixel 9 Official DPS', '03244924243', FALSE, 'f08553ca-5283-4a44-87d7-50d116483899', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 210000, NULL, NULL, 'Official; PTA Approved', 'Noman Pixel 9 Official DPS
official PTA approved
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (58, 155, '2026-02-16', 'Zeeshan Pixel 8 Official Hazel', '03208446571', FALSE, 'f96a6bb7-8fe1-4620-8839-86ce88a67d7f', 'Google', 'pixel 8', 'pixel 8', 1, 85000, '256GB', NULL, 'Official; 3 days check warranty', 'Zeeshan Pixel 8 Official Hazel
3 days check warranty for
battery and software
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (59, 154, '2026-02-14', 'Hamza Khan 4a 5g Buyer', '03126174762', FALSE, 'c74c844c-b704-467c-8473-e52e7d5f1447', 'Google', 'pixel 8', 'pixel 8', 1, 89000, '256GB', NULL, 'Official', 'Hamza Khan 4a 5g Buyer
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (60, 153, '2026-02-14', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'buds pro 2', 'buds pro 2', 1, 27000, NULL, NULL, NULL, 'Waqar G 7 Fazal Centre
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (61, 152, '2026-02-14', 'Sharjeel Pixel 9 Green', '03356599115', FALSE, 'd85d5ab9-7b55-4858-b873-188b4e31fda0', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 202000, NULL, NULL, NULL, 'Sharjeel Pixel 9 Green
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (62, 151, '2026-02-14', 'Ahmad 6 Pro 256gb Buyer', '03019451024', FALSE, '7805875e-6e9f-49bb-99d0-560b3352c841', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 126000, '256GB', NULL, 'Official; 3 days check warranty', 'Ahmad 6 Pro 256gb Buyer
3 days check warranty for
battery and software
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (63, 150, '2026-02-12', 'Rana Zain G 47 IT Tower', '03064488877', FALSE, '965f9e9b-786f-41ba-8b2b-5118d0ba0837', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 210000, NULL, NULL, NULL, 'Rana Zain G 47 IT Tower
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (64, 149, '2026-02-12', 'Abdullah Tariq Pixel 8 Black', '03218846206', FALSE, '5c1a320b-4836-419d-b0b7-be840f26e006', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 148000, NULL, NULL, 'CPID; 3 days check warranty', 'Abdullah Tariq Pixel 8 Black
CPID done tax paid 3 days
check warranty for battery and
software
pixel 9 pro 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (65, 148, '2026-02-12', 'Usama Asghar Shop 123', '03167901747', FALSE, 'dc974d69-4410-4386-9545-ec33c013a34b', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 177000, NULL, NULL, 'CPID', 'Usama Asghar Shop 123
Hafeez Centre
CPID done tax paid
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (66, 147, '2026-02-12', 'M Irfan 7 Official White', '03456680016', FALSE, '02a4ee17-58b4-46dd-a87d-40168ec5d355', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 56500, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'M Irfan 7 Official White
official PTA approved 3 days
check warranty for battery and
software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (67, 146, '2026-02-12', 'Muneeb Ali Solar Star Pixel', '03327873640', FALSE, 'fa699483-ab55-4c00-acd6-fb82542df5fb', 'Google', 'pixel 10 pro xl', 'pixel 10 pro xl; chargers', 2, 305000, NULL, NULL, '3 days check warranty', 'Muneeb Ali Solar Star Pixel
10proxl
3 days check warranty for
battery and software pixel 9
pro purchase 1201k,80k online
5k cash
pixel 10 pro xl 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (68, 145, '2026-02-09', 'Raza Pixel 6 Pro Official', '03007985229', FALSE, 'c01b4391-f8b8-4016-b55b-087d8a6acd94', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 73000, NULL, NULL, 'Official; 3 days check warranty', 'Raza Pixel 6 Pro Official
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (69, 144, '2026-02-09', 'Usama Pixel 7', '03254244804', FALSE, '7abcae5a-167e-497b-938a-ffba58bc485f', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 55000, NULL, NULL, 'Official; 3 days check warranty', 'Usama Pixel 7
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (70, 143, '2026-02-09', 'Shahjhan Pixel Buds 1', '03336565594', FALSE, 'ee8250c3-18d3-4241-b7ae-272a97e6ee01', 'Google', 'buds pro 1', 'buds pro 1', 1, 15000, NULL, NULL, NULL, 'Shahjhan Pixel Buds 1
buds pro 1 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (71, 142, '2026-02-09', 'Jahgnir 9proxl 512gb', NULL, TRUE, '0afb6dee-3b8f-4a47-96c5-7e0886a7eec0', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 225000, '512GB', NULL, '3 days check warranty', 'Jahgnir 9proxl 512gb
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (72, 141, '2026-02-09', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 6', 'pixel 6', 1, 40000, NULL, NULL, '3 days check warranty', 'Waqar G 7 Fazal Centre
3 days check warranty for
battery and software
pixel 6 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (73, 140, '2026-02-09', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 7', 'pixel 7', 1, 61000, '256GB', NULL, 'Official', 'Waqar G 7 Fazal Centre
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (74, 139, '2026-02-06', 'Fahad Butt G 07', '03224011666', FALSE, '28d138a9-5124-4dc1-90f4-915eff14c71e', 'Samsung', 's 25 ultra', 's 25 ultra', 1, 265000, NULL, NULL, NULL, 'Fahad Butt G 07
s 25 ultra 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (75, 138, '2026-02-06', 'Zaid G 6 Fazal Trade Centre', '03004101021', FALSE, 'ba3cd72e-c413-4fb7-a6f3-8714935e67bf', NULL, NULL, NULL, 0, 46000, NULL, NULL, NULL, 'Zaid G 6 Fazal Trade Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (76, 137, '2026-02-06', 'Hashim Sheikh 7 Buyer', '03088636501', FALSE, 'b918057a-a39c-4f4b-ab54-6c1737049116', 'Google', 'Pixel 10', 'Pixel 10', 1, 200000, NULL, NULL, NULL, 'Hashim Sheikh 7 Buyer
Pixel 10 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (77, 136, '2026-02-05', 'Ayub 9 Pro Official With Box', '03074053934', FALSE, '0c933b26-bda8-4c05-ad15-8d071e6a952e', 'Google', 'cables', 'cables; chargers; pixel 9 pro', 3, 213000, NULL, NULL, 'Official; 3 days check warranty', 'Ayub 9 Pro Official With Box
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (78, 135, '2026-02-04', 'Tanveer Pixel 7a Black', '03296772800', FALSE, '9872e095-e5c5-4b66-846a-9f66e9eaf0bb', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 58000, NULL, NULL, 'Official', 'Tanveer Pixel 7a Black
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (79, 134, '2026-02-04', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 8', 'pixel 8', 1, 97000, '256GB', NULL, 'Official', 'Waqar G 7 Fazal Centre
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (80, 133, '2026-02-03', 'Adnan Qurashi G 7 Jazz', NULL, TRUE, '025a35d0-3db8-4e01-8be8-be3bba9a9b20', 'Google', 'pixel 7', 'pixel 7', 1, 62000, '256GB', NULL, 'Official', 'Adnan Qurashi G 7 Jazz
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (81, 132, '2026-02-06', 'Hashim Sheikh 7 Buyer', '03088636501', FALSE, 'b918057a-a39c-4f4b-ab54-6c1737049116', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 180000, NULL, NULL, 'Exchange/Adjustment; Has remaining balance', 'Hashim Sheikh 7 Buyer
178k-78k-50k(7 adjusted) 50k
balance
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (82, 131, '2026-02-03', 'Arvo Kamran', '03034565618', FALSE, 'd43418eb-6bea-4d65-ad7f-50f880ad7024', 'Google', 'cables', 'cables', 1, 65700, '256GB', NULL, 'Official; 3 days check warranty', 'Arvo Kamran
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (83, 130, '2026-02-02', 'Hashim Sheikh 7 Buyer', '03088636501', FALSE, 'b918057a-a39c-4f4b-ab54-6c1737049116', NULL, NULL, NULL, 0, 255000, NULL, NULL, 'Brand new/Box pack', 'Hashim Sheikh 7 Buyer
brand new box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (84, 129, '2026-02-02', 'Abdul Mannan Pixel 9 Box', '03021496233', FALSE, '6da1f386-0d00-4ce7-997e-6399c16c3d7d', 'Google', 'pixel 9', 'pixel 9', 1, 155000, NULL, '353420940086765', 'Brand new/Box pack', 'Abdul Mannan Pixel 9 Box
Pack
box pack 353420940086765
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (85, 128, '2026-01-31', 'Shahbaz Pixel 7a Official', '03216609021', FALSE, '214c6fe6-724f-48b4-9ffe-2d892694ac57', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Shahbaz Pixel 7a Official
White
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (86, 127, '2026-01-31', 'Fahad Butt G 07', '03224011666', FALSE, '28d138a9-5124-4dc1-90f4-915eff14c71e', NULL, NULL, NULL, 0, 80000, NULL, NULL, NULL, 'Fahad Butt G 07', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (87, 126, '2026-01-31', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official; pixel 8 pro box pack', 2, 255000, '128GB', NULL, 'Brand new/Box pack; Official; Has remaining balance; Received: 80k recieved', 'Abyaan Saeed 123 Hafeez
Centre
80k recieved 175k balance
pixel 8 pro 128gb official 1 pcs
pixel 8 pro box pack 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (88, 125, '2026-01-31', 'Waqar Ahmed 6 Pro Buyer', '03218202692', FALSE, 'b145d597-cefa-4786-81a9-3d39af336f8c', 'Google', 'buds pro 1', 'buds pro 1', 1, 100000, '256GB', NULL, 'Official; 3 days check warranty; Received: 65k received', 'Waqar Ahmed 6 Pro Buyer
pixel 6 purchased for 35000
65k received 3 days check
warranty for battery and
software
buds pro 1 1 pcs
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (89, 124, '2026-01-31', 'Kamran Tahir 9A', '03362823938', FALSE, '9971b6b0-a08c-410d-89c1-46d49698a681', 'Google', 'buds pro 2', 'buds pro 2', 1, 28000, NULL, NULL, NULL, 'Kamran Tahir 9A
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (90, 123, '2026-01-30', 'Waqar Bhai Technocares', '03216484653', FALSE, '5ad9564e-7000-42c5-afdc-3a319f1f0550', NULL, 'cables', 'cables; chargers', 2, 200000, NULL, NULL, NULL, 'Waqar Bhai Technocares
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (91, 122, '2026-01-30', 'Zuhair Zafar S 24 Ultra', '03405557439', FALSE, 'b1db4c8e-4606-4691-874e-61600f6fd95a', 'Samsung', 's 24 ultra', 's 24 ultra', 1, 220000, NULL, NULL, NULL, 'Zuhair Zafar S 24 Ultra
price inclusive of PTA tax', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (92, 121, '2026-01-28', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', 'Google', 'buds pro 1', 'buds pro 1', 1, 13500, NULL, NULL, NULL, 'Zain 7a Buyer Iqbal Town
buds pro 1 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (93, 120, '2026-01-29', 'Umar Siddiqur Khateeb', '03065533447', FALSE, '26364188-14f6-48c9-9897-fb77bd4c9067', 'Google', 'pixel 7', 'pixel 7', 1, 60000, '256GB', NULL, 'Official', 'Umar Siddiqur Khateeb
Accessories
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (94, 119, '2026-01-28', 'Faheem Iphone 11', '03221873298', FALSE, 'a3069572-4cad-48f3-a363-9b76c5286ec1', NULL, NULL, NULL, 0, 40000, NULL, NULL, '3 days check warranty', 'Faheem Iphone 11
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (95, 118, '2026-01-27', 'Uzair Yousaf Islamabad Pixel', '03123880666', FALSE, '08d8952f-b1ef-4e94-bc92-d65df077bcbc', 'Google', 'pixel 7', 'pixel 7', 1, 68000, '256GB', NULL, 'Official; 3 days check warranty', 'Uzair Yousaf Islamabad Pixel
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (96, 117, '2026-01-27', 'Rizwan 9 Pro XL 256gb Official', '03079396200', FALSE, 'f8a74162-889f-4c58-98f3-e7c17d886817', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 197000, '256GB', NULL, 'Official; 3 days check warranty', 'Rizwan 9 Pro XL 256gb Official
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (97, 116, '2026-01-27', 'Farhan Ali Pixel 8pro Box Pack', NULL, TRUE, '57970b5c-b926-4e32-a726-7e4837bfd92b', 'Google', 'pixel 8 pro box pack', 'pixel 8 pro box pack', 1, 125000, NULL, NULL, 'Brand new/Box pack; 3 days check warranty', 'Farhan Ali Pixel 8pro Box Pack
3 days check warranty for
battery and software
pixel 8 pro box pack 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (98, 115, '2026-01-27', 'Arshad Aluminum Pixel 6a', '03324904123', FALSE, '6da5a40b-7c3d-49c7-b815-a221e3baa050', 'Google', 'PIXEL 6A OFFICIAL PTA', 'PIXEL 6A OFFICIAL PTA', 1, 45000, NULL, NULL, 'Official; 3 days check warranty', 'Arshad Aluminum Pixel 6a
Official
3 days check warranty for
battery and software
PIXEL 6A OFFICIAL PTA 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (99, 114, '2026-01-29', 'Nadeem Aziz 4a 5g Saddar', '03214141173', FALSE, 'cdf8d852-0df8-4fc5-890b-5cac98df839e', NULL, 'cables', 'cables', 1, 85000, NULL, NULL, '3 days check warranty', 'Nadeem Aziz 4a 5g Saddar
3 days check warranty for
battery and software
cables 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (100, 113, '2026-01-26', 'PIXEL 8 official 128gb/256gb', NULL, TRUE, '2d8737b9-b8dd-4046-a764-c5d521c7bb5c', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 58000, '256GB', NULL, 'Official; 3 days check warranty', 'PIXEL 8 official 128gb/256gb
1 pcs
Fakhar 7a Blue Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (101, 112, '2026-01-26', 'Afzal Pixel 6 Official', '03076729588', FALSE, '77f0cd6f-8d38-4daf-8420-454a563bd0dc', 'Google', 'cables', 'cables; chargers; pixel 6', 3, 51500, NULL, NULL, 'Official; 3 days check warranty', 'Afzal Pixel 6 Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 6 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (102, 111, '2026-01-24', 'Adnan Qurashi G 7 Jazz', NULL, TRUE, '025a35d0-3db8-4e01-8be8-be3bba9a9b20', 'Google', 'pixel 6', 'pixel 6', 1, 50000, NULL, NULL, '3 days check warranty', 'Adnan Qurashi G 7 Jazz
3 days check warranty for
battery and software
pixel 6 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (103, 110, '2026-01-24', 'Ali Husnain Pixel 9 Black', '03026056893', FALSE, '1cb14bef-d426-4159-a38f-b6d45ed366b5', 'Google', 'pixel 9', 'pixel 9', 1, 140000, '256GB', NULL, 'Exchange/Adjustment; Has remaining balance', 'Ali Husnain Pixel 9 Black
13 pro 256gb adjusted in 152k
balance paid 12k
pixel 9 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (104, 109, '2026-01-22', 'Tauseef Pixel 8 Official PTA', '03073511159', FALSE, 'c2d5981f-b473-4eb0-be0e-b71d267267df', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 88000, '128GB', NULL, 'Official; PTA Approved; 3 days check warranty', 'Tauseef Pixel 8 Official PTA
official PTA approved 3 days
check warranty for battery and
software
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (105, 108, '2026-01-22', 'Syed Ahsan Ali Shah Fold 8', '00971551710302', FALSE, 'f6b68ade-b15d-45ee-8447-136ce0a211a4', 'Samsung', 'cables', 'cables; chargers', 2, 137000, NULL, NULL, '3 days check warranty', 'Syed Ahsan Ali Shah Fold 8
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (106, 107, '2026-01-21', 'Salim Ullah Khan Ghauri S 22', '03008447991', FALSE, 'c23a737f-89b8-46e5-87d4-03f3782310e9', 'Samsung', 'S 22 ultra', 'S 22 ultra', 1, 105000, NULL, NULL, NULL, 'Salim Ullah Khan Ghauri S 22
Ultra
S 22 ultra 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (107, 106, '2026-01-21', 'Ali Wahaj 9 Pro XL', '03247456111', FALSE, 'cf6b1b64-e615-4045-a1db-10962c3909d8', 'Google', 'buds pro 2', 'buds pro 2', 1, 25000, NULL, NULL, NULL, 'Ali Wahaj 9 Pro XL
porcelain colour
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (108, 105, '2026-01-20', 'Usman Bonton Mobile 123', '03218888366', FALSE, '53a1ef52-935d-4110-bcbd-689cc4670d33', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 205000, NULL, NULL, 'Official; PTA Approved', 'Usman Bonton Mobile 123
Hafeez Centre
official PTA approved Hazel
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (109, 104, '2026-01-20', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', 'Samsung', 'S 22 ultra', 'S 22 ultra', 1, 147500, NULL, NULL, NULL, 'Adnan MZ Mobile
S 22 ultra 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (110, 103, '2026-01-20', 'Ghufran 13t Black', '03326961049', FALSE, '74580618-7a9e-4166-8092-680ad4970091', 'OnePlus', 'OnePlus 13t', 'OnePlus 13t', 1, 148000, NULL, NULL, NULL, 'Ghufran 13t Black
OnePlus 13t 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (111, 102, '2026-01-20', 'Abdullah 6 Pro', '03201900055', FALSE, '6adacb52-0e71-4732-a7f7-5421b70e66f9', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 72500, NULL, NULL, 'Official; 3 days check warranty', 'Abdullah 6 Pro
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (112, 101, '2026-01-17', 'Awais Pixel 9 White Non Pta', '03314205700', FALSE, 'ace7cb69-a10f-4eb3-8a1c-818b362cc363', 'Google', 'cables', 'cables; chargers; pixel 9', 3, 139000, NULL, NULL, 'Non-PTA', 'Awais Pixel 9 White Non Pta
cables 1 pcs
chargers 1 pcs
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (113, 100, '2026-01-17', 'Hasseb Khan 6 Pro Official', '03475544792', FALSE, '7f925136-9f18-4513-a511-3f29f0533473', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 70000, NULL, NULL, 'Official; 3 days check warranty', 'Hasseb Khan 6 Pro Official
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (114, 99, '2026-01-17', 'Armaghan Buds Pro 2 RWP', '03025388154', FALSE, 'ddd27eb5-3780-4233-a05c-a15b10f8a53e', 'Google', 'buds pro 2', 'buds pro 2', 1, 26000, NULL, NULL, NULL, 'Armaghan Buds Pro 2 RWP
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (115, 98, '2026-01-17', 'Faizan Pixel 6 Pro Official', '03088716269', FALSE, '2642bdcb-6e75-4cbf-9212-7e3edc660bdf', 'Google', 'cables', 'cables; chargers; pixel 6 pro official', 3, 75000, NULL, NULL, 'Official', 'Faizan Pixel 6 Pro Official
cables 1 pcs
chargers 1 pcs
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (116, 97, '2026-01-17', 'Wahab 7a Official White', '03241449590', FALSE, '5853e376-acdd-4597-a44f-f51730f42aa4', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 57000, NULL, NULL, 'Official; 3 days check warranty', 'Wahab 7a Official White
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (117, 96, '2026-01-16', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (118, 95, '2026-01-16', 'Shoaib Pixel 8 Pro Box Pack', '03160419164', FALSE, '564a6be6-2ac2-4c6d-85ad-bb4697d98e4c', 'Google', 'pixel 8 pro box pack', 'pixel 8 pro box pack', 1, 112000, NULL, NULL, 'Brand new/Box pack; 3 days check warranty', 'Shoaib Pixel 8 Pro Box Pack
3 days check warranty for
battery and software
pixel 8 pro box pack 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (119, 94, '2026-01-16', 'Mrs Saiqa Pixel 9 Green', '03204602426', FALSE, '0593c7eb-f133-4ea0-8230-fdacd5584a16', 'Google', 'pixel 9', 'pixel 9', 1, 135000, NULL, NULL, '3 days check warranty', 'Mrs Saiqa Pixel 9 Green
3 days check warranty for
battery and software
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (120, 93, '2026-01-17', 'Imran Bhai G 05', '03004201164', FALSE, 'e3bb8a50-276c-4766-b784-01e92538272a', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official', 'Imran Bhai G 05
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (121, 92, '2026-01-16', 'Hidayat Pixel 9 Black', '03333222312', FALSE, 'f0955060-2d2d-4753-9e93-1bc46a8e81df', 'Google', 'cables', 'cables; chargers; pixel 9', 3, 136000, NULL, NULL, '3 days check warranty', 'Hidayat Pixel 9 Black
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (122, 91, '2026-01-15', 'Rizwan Ali Pixel 8 Official PTA', '03034062369', FALSE, '72b73519-e830-4bb5-bf99-95cf6f8c43ff', 'Google', 'pixel 8', 'pixel 8', 1, 91000, '256GB', NULL, 'Official; 3 days check warranty', 'Rizwan Ali Pixel 8 Official PTA
3 days check warranty for
battery and software
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (123, 90, '2026-01-14', 'Saad Pixel 7a Official PTA', '03014510468', FALSE, '04269393-0cad-4abc-9da6-21f35e85dadc', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Saad Pixel 7a Official PTA
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (124, 89, '2026-01-14', 'Ejaz 9 PRO XL 128gb Official', '03234747492', FALSE, 'c465c21e-d752-42d1-9573-51d8d5d462e9', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 202000, '128GB', NULL, 'Official; 3 days check warranty', 'Ejaz 9 PRO XL 128gb Official
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (125, 88, '2026-01-14', 'Main Zia 9 Pro XL Black', NULL, TRUE, 'c2a76b21-119f-4288-8f95-b0c6f3ef92f8', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 180000, NULL, NULL, NULL, 'Main Zia 9 Pro XL Black
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (126, 87, '2026-01-13', 'Tabish 9 Pro 128gb', '03334337202', FALSE, '7eae076e-0172-4131-b4ea-924507e778aa', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 165000, '128GB', NULL, '3 days check warranty', 'Tabish 9 Pro 128gb
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (127, 86, '2026-01-13', 'Mubeen Pixel 7a Official', '03000843349', FALSE, 'a6523b10-9447-43d1-9bed-6692eda099b9', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Mubeen Pixel 7a Official
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (128, 85, '2026-01-13', 'Asad Straight Ways IT Tower', '03154277445', FALSE, '807825d5-b3ed-4192-be60-3a1fe4bf8a2b', 'Google', 'Pixel 10', 'Pixel 10', 1, 140000, NULL, NULL, '3 days check warranty', 'Asad Straight Ways IT Tower
3 days check warranty for
battery and software
3544076611979129
Pixel 10 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (129, 84, '2026-01-12', 'Umar Buds Pro 2 DHA', '03337456587', FALSE, 'd37843f4-5ee8-42ae-8ea8-c26fb044be33', 'Google', 'buds pro 2', 'buds pro 2', 1, 26000, NULL, NULL, NULL, 'Umar Buds Pro 2 DHA
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (130, 83, '2026-01-12', 'Adnan Qurashi G 7 Jazz', NULL, TRUE, '025a35d0-3db8-4e01-8be8-be3bba9a9b20', NULL, NULL, NULL, 0, 200000, NULL, NULL, NULL, 'Adnan Qurashi G 7 Jazz', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (131, 82, '2026-01-11', 'Waqas 7a Buyer Wapda Town', '03094404021', FALSE, 'bfcac508-a60a-4e9a-a67b-5ac6777edc2e', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 83000, NULL, NULL, 'CPID; 3 days check warranty', 'Waqas 7a Buyer Wapda Town
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (132, 81, '2026-01-09', 'Muhammad Ahmed Pixel 6a', '03040605671', FALSE, '79297d42-0978-4575-965e-f6f95252a4d9', 'Google', 'pixel 7', 'pixel 7', 1, 64500, '256GB', NULL, 'Official; 3 days check warranty', 'Muhammad Ahmed Pixel 6a
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (133, 80, '2026-01-09', 'Muzaffar 6a Buyer Teacher', '03333666169', FALSE, 'f6bb23f8-2627-42d6-9f43-74743656f3d2', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 200000, NULL, NULL, '3 days check warranty', 'Muzaffar 6a Buyer Teacher
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (134, 79, '2026-01-08', 'Moeen 10 Pro With Box', '03074099495', FALSE, '3312df63-f0e1-49dd-815e-50bd96a78a8d', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 165000, NULL, NULL, '3 days check warranty', 'Moeen 10 Pro With Box
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (135, 78, '2026-01-09', 'Mariam 8a Buyer', '03214128887', FALSE, 'f5933d11-8d7a-4107-aee9-6e07a30a83c2', 'Google', 'cables', 'cables; chargers', 2, 65000, '256GB', NULL, 'Official; 3 days check warranty', 'Mariam 8a Buyer
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7 official 128gb/256gb 1
pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (136, 77, '2026-01-08', 'Farhan 6 Pro Official PTA', '03038804413', FALSE, 'be809ac3-6b65-4ec9-aa69-ed1cbe48befa', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 69000, NULL, NULL, 'Official; 3 days check warranty; Has remaining balance', 'Farhan 6 Pro Official PTA
3 days check warranty for
battery and software balance
2500
pixel 6 pro official 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (137, 76, '2026-01-07', 'Ahmad G 114 Peer Jee', '03055147077', FALSE, 'c9e710be-7326-451d-8852-8cf7a76a8750', 'Google', 'pixel 9', 'pixel 9', 1, 148000, NULL, NULL, NULL, 'Ahmad G 114 Peer Jee
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (138, 75, '2026-01-07', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 58000, NULL, NULL, 'Official; 7 days check warranty', 'Waqar G 7 Fazal Centre
7 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (139, 74, '2026-01-07', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 57000, NULL, NULL, 'Official', 'Haris
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (140, 73, '2026-01-07', 'Sarim Shahid Pixel 6 Pro', '03323145050', FALSE, 'eb205cd9-28e0-4da9-a7ca-110377fe170a', 'Google', 'pixel 6 pro official', 'pixel 6 pro official', 1, 78000, NULL, NULL, 'Official; 3 days check warranty', 'Sarim Shahid Pixel 6 Pro
Official 512
3 days check warranty for
battery and software
pixel 6 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (141, 72, '2026-01-07', 'Ahmad Khan 7a Official', '03070976598', FALSE, '747f5612-0805-4de3-9b00-ccf39a27aa54', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 55500, NULL, NULL, 'Official; 3 days check warranty', 'Ahmad Khan 7a Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (142, 71, '2026-01-07', 'Tajamul Ashraf 13t Brand New', '03497543766', FALSE, '36cc3502-c150-4b1b-b6ef-18b420c70bbd', 'OnePlus', 'cables', 'cables; OnePlus 13t; chargers', 3, 150000, NULL, NULL, 'Brand new/Box pack', 'Tajamul Ashraf 13t Brand New
cables 1 pcs
OnePlus 13t 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (143, 70, '2026-01-06', 'Nadeem G 18', '03004487710', FALSE, 'f64efc9f-d6a0-4369-bde6-7cca1739a358', 'Google', 'pixel 8', 'pixel 8', 1, 93000, '256GB', NULL, 'Official; 3 days check warranty', 'Nadeem G 18
3 days check warranty for
battery and software
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (144, 69, '2026-01-06', 'Sualiha Pixel 7a Official PTA', '03064445132', FALSE, 'ae1977b9-a41b-4a72-8080-869a25114fd7', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Sualiha Pixel 7a Official PTA
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (145, 68, '2026-01-06', 'Uzair Yousaf Islamabad Pixel', '03123880666', FALSE, '08d8952f-b1ef-4e94-bc92-d65df077bcbc', 'Google', 'pixel 7', 'pixel 7', 1, 130000, '256GB', NULL, 'Official', 'Uzair Yousaf Islamabad Pixel
pixel 7 official 128gb/256gb 2
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (146, 67, '2026-01-05', 'Moeen 10 Pro With Box', '03074099495', FALSE, '3312df63-f0e1-49dd-815e-50bd96a78a8d', NULL, NULL, NULL, 0, 218000, NULL, NULL, '3 days check warranty', 'Moeen 10 Pro With Box
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (147, 66, '2026-01-03', 'Abdul Munim Father Of', '03009450058', FALSE, '02ca7a35-8bce-489c-be28-52e284fb0b93', 'Google', 'pixel 8', 'pixel 8', 1, 100000, '256GB', NULL, 'Official', 'Abdul Munim Father Of
Khuzaim
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (148, 65, '2026-01-03', 'Pixel 7 Official', '03267733444', FALSE, 'ff5b6ac3-f2af-4033-9155-f456ca1d3579', 'Google', 'pixel 7', 'pixel 7', 1, 64000, '256GB', NULL, 'Official', 'Pixel 7 Official
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (149, 64, '2026-01-02', 'Ali Buyer 4a 5g Mandi', NULL, TRUE, 'cac3ab63-da0e-4801-a585-e9f52ff00ba1', 'Google', 'buds pro 1', 'buds pro 1; pixel 7a official', 2, 69000, NULL, NULL, 'Official; Has remaining balance; Received: 25k recieved', 'Ali Buyer 4a 5g Mandi
bahuddin
25k recieved 44k balance
buds pro 1 1 pcs
pixel 7a official 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (150, 63, '2026-01-02', 'Jawad 8 Pro 256gb Official', '03316414886', FALSE, '804a141f-5e12-4763-b15b-56bc15ce5c50', 'Google', 'cables', 'cables; chargers; pixel 8 pro 256 official', 3, 136000, '256GB', NULL, 'Official; 3 days check warranty', 'Jawad 8 Pro 256gb Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 8 pro 256 official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (151, 62, '2026-01-02', 'Shehroz Pixel 7 Pro Official', '03234509250', FALSE, '5f9948e7-82e3-4af6-955d-b545a4156bcf', 'Google', 'pixel 7 pro official', 'pixel 7 pro official', 1, 93000, NULL, NULL, 'Official; 3 days check warranty', 'Shehroz Pixel 7 Pro Official
3 days check warranty for
battery and software
pixel 7 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (152, 60, '2025-12-31', 'Adnan Pixel 8 Official PTA', '03018484964', FALSE, 'eb491ca9-787b-48be-ab50-ec41fb559303', 'Google', 'pixel 8', 'pixel 8', 1, 89000, '256GB', NULL, 'Official; 3 days check warranty', 'Adnan Pixel 8 Official PTA
3 days check warranty for
battery and software
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (153, 59, '2025-12-31', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 75000, NULL, NULL, 'Non-PTA', 'Mudassir Kalpay
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (154, 58, '2025-12-31', 'Zylon 8 Pro 256gb', '03052918121', FALSE, '1f875cc0-9938-4561-adef-ef3ef15acd6e', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 70000, '256GB', NULL, 'Has remaining balance; Received: 25k recieved', 'Zylon 8 Pro 256gb
25k recieved 45k balance
pixel 9 pro 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (155, 57, '2025-12-29', 'Farhana Sultan 7a Online Pta', '03006633867', FALSE, '5f39eb52-6ad0-469f-ab26-3abe49c473b6', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 46000, NULL, NULL, 'Official; 3 days check warranty', 'Farhana Sultan 7a Online Pta
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (156, 55, '2025-12-27', 'M Omar Pixel 8', '03028008257', FALSE, '397e653d-6bcf-4174-a5b1-4029958303fd', 'Google', 'pixel 8', 'pixel 8', 1, 55000, '256GB', NULL, 'Official; 3 days check warranty', 'M Omar Pixel 8
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (157, 54, '2025-12-26', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official', 'Waqar G 7 Fazal Centre
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (158, 53, '2025-12-25', 'Bilal Shah Shop 3 Fazal Trade', '03224555355', FALSE, '267c6ed8-5994-41da-9841-a4719ff77433', 'Google', 'pixel 8', 'pixel 8', 1, 89000, '256GB', NULL, 'Official', 'Bilal Shah Shop 3 Fazal Trade
Centre
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (159, 52, '2025-12-24', 'Kamran Tahir 9A', '03362823938', FALSE, '9971b6b0-a08c-410d-89c1-46d49698a681', 'Samsung', 's 25 ultra', 's 25 ultra', 1, 115000, '256GB', NULL, 'CPID; Exchange/Adjustment', 'Kamran Tahir 9A
9 pro XL CPID 256gb adjusted
in 150k
s 25 ultra 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (160, 51, '2025-12-24', 'Mateen C/o Tariq Siddique', '03218470097', FALSE, '13c25560-32ac-408b-b3d7-34603ba58478', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 214000, NULL, NULL, NULL, 'Mateen C/o Tariq Siddique
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (161, 50, '2025-12-24', 'Hamza Pixel 6', '03134753205', FALSE, '4258aa94-0c42-43d3-948f-a4c6058bf983', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 20000, NULL, NULL, 'Official; PTA Approved; Exchange/Adjustment; Received: 20k
recieved', 'Hamza Pixel 6
pixel 6 adjusted in 35k 20k
recieved in cash it''s official
PTA approved
pixel 7a official 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (162, 49, '2025-12-24', 'Afzal Shah Pixel 7 Pro', '03156410785', FALSE, '819f1019-9872-4e30-8786-96688e493286', 'Google', 'pixel 7 pro official', 'pixel 7 pro official', 1, 98000, NULL, NULL, 'Official; 3 days check warranty', 'Afzal Shah Pixel 7 Pro
3 days check warranty for
battery and software
pixel 7 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (163, 48, '2025-12-24', 'Ameer Hamza Pixel 9 Box', '03225697676', FALSE, 'd3e8cfa5-41ea-423c-88d0-85d7307022c0', 'Google', 'pixel 9', 'pixel 9', 1, 147000, NULL, NULL, 'Brand new/Box pack', 'Ameer Hamza Pixel 9 Box
Pack
box pack
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (164, 47, '2025-12-24', 'Zain Gohar Pixel 8', '03234448048', FALSE, '5b558171-2b08-48f7-9df2-9881cebeb888', 'Google', 'pixel 8', 'pixel 8', 1, 95000, '256GB', NULL, 'Official; 3 days check warranty', 'Zain Gohar Pixel 8
3 days check warranty for
battery and software
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (165, 46, '2025-12-24', 'Dr Sajjad Pixel 7 Pro', '03008667752', FALSE, 'eb11b6e4-903d-4d21-837e-cfdab7018609', 'Google', 'pixel 7 pro official', 'pixel 7 pro official', 1, 92000, NULL, NULL, 'Official; 3 days check warranty', 'Dr Sajjad Pixel 7 Pro
3 days check warranty for
battery and software library
pixel 7 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (166, 45, '2025-12-24', 'Arshad Mahmood 9 Pro', '03462632328', FALSE, 'd681dd11-b148-4774-9dfc-a012bd8df1fc', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 175000, '256GB', NULL, '3 days check warranty', 'Arshad Mahmood 9 Pro
Peshawar
3 days check warranty for
battery and software it''s
256gb variant
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (167, 44, '2025-12-21', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 75000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Abyaan Saeed 123 Hafeez
Centre
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (168, 43, '2025-12-20', 'Umar OnePlus 13t 512gb', '03124235536', FALSE, 'fa23af23-8367-4593-b0a6-798808a7c87f', 'OnePlus', 'cables', 'cables; OnePlus 13t; chargers', 3, 150000, '512GB', NULL, '3 days check warranty', 'Umar OnePlus 13t 512gb
3 days check warranty for
battery and software
cables 1 pcs
OnePlus 13t 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (169, 42, '2025-12-20', 'Asad 9 Pro XL Official', '03104058581', FALSE, '089c615d-1eaf-4e4d-9825-f9a1c37634f0', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 208000, NULL, NULL, 'Official; 3 days check warranty', 'Asad 9 Pro XL Official
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (170, 41, '2025-12-19', 'Muzammil 13t Black', '03054385329', FALSE, '62fdd520-5edc-4754-8fcf-de5554ee8562', 'OnePlus', 'cables', 'cables; OnePlus 13t; chargers', 3, 150000, NULL, NULL, NULL, 'Muzammil 13t Black
cables 1 pcs
OnePlus 13t 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (171, 40, '2025-12-19', 'Qamar Pixel 7a Official', '03114598265', FALSE, '1a9fe268-c88d-418f-a97d-bfe71af99d8a', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 52000, NULL, NULL, 'Official; 3 days check warranty', 'Qamar Pixel 7a Official
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (172, 39, '2025-12-19', 'Ayesha Buds Pro 2', '03342578604', FALSE, 'e5893459-4a0e-450d-a724-b89e91813a47', 'Google', 'buds pro 2', 'buds pro 2', 1, 27000, NULL, NULL, '3 days check warranty', 'Ayesha Buds Pro 2
3 days check warranty
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (173, 38, '2025-12-19', 'Rana Bilal 7 Official PTA', '03224745655', FALSE, '8a936422-bdce-4b36-bf1f-8d83ddc01cc0', 'Google', 'pixel 7', 'pixel 7', 1, 70000, '256GB', NULL, 'Official; 3 days check warranty', 'Rana Bilal 7 Official PTA
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (174, 37, '2025-12-19', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', 'Google', 'pixel 7 pro official', 'pixel 7 pro official', 1, 93000, NULL, NULL, 'Official', 'Ahmad 4a 5g Baghbanpura
pixel 7 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (175, 36, '2025-12-18', 'Malik Shahid Pixel 7 Official', '03494557903', FALSE, 'a6b4bfca-31a1-4d98-8f87-f6cb31eb881c', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official; 3 days check warranty', 'Malik Shahid Pixel 7 Official
White
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (176, 35, '2025-12-19', 'Ali Gull 7 Black Official', '03140849657', FALSE, 'ad8deb11-1486-447b-9812-1a1780d74b88', 'Google', 'cables', 'cables; chargers', 2, 69000, '256GB', NULL, 'Official; 3 days check warranty', 'Ali Gull 7 Black Official
3 days check warranty for
battery and software price
inclusive of charger cable front
glass back cover
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (177, 34, '2025-12-18', 'Asad Abrar CM Office 8 Pro', '03334275334', FALSE, '50906cf4-c9db-4fee-b65c-16747f4bcafb', NULL, NULL, NULL, 0, 110000, NULL, NULL, '3 days check warranty', 'Asad Abrar CM Office 8 Pro
Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (178, 33, '2025-12-16', 'Malik Ahmad Sahiwal 10 Pro', '03396901755', FALSE, '0a80ff0f-488b-4242-9543-25141ef66c93', NULL, NULL, NULL, 0, 225000, NULL, NULL, 'Brand new/Box pack', 'Malik Ahmad Sahiwal 10 Pro
brand new box pack physical
sim used esim time available
it''s under google warranty till
November 2027', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (179, 32, '2025-12-17', 'Imran Masih 7a Official', '03024210489', FALSE, 'f7fe17d2-74a1-403a-ae82-c02d1d1cabab', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 54000, NULL, '353617353130622', 'Official; 3 days check warranty', 'Imran Masih 7a Official
3 days check warranty for
battery and software
353617353130622-30630
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (180, 31, '2025-12-18', 'Arshad Mahmood 9 Pro', '03462632328', FALSE, 'd681dd11-b148-4774-9dfc-a012bd8df1fc', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 175000, NULL, NULL, '3 days check warranty', 'Arshad Mahmood 9 Pro
Peshawar
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (181, 30, '2025-12-24', 'Raja Moazzam 9a Box Pack', '03088248017', FALSE, '450382fb-0ad3-481a-8c41-fc4262736afd', 'Google', 'pixel 9a', 'pixel 9a', 1, 132000, NULL, NULL, 'Brand new/Box pack', 'Raja Moazzam 9a Box Pack
Islamabad
BRAND NEW BOX PACK WITH
2 YEARS WARRANTY by
google UK
pixel 9a 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (182, 29, '2025-12-15', 'Ahsan Baig 6a Official', '03212977273', FALSE, '4028d146-3bdb-4bfe-b006-af9294380aee', 'Google', 'PIXEL 6A OFFICIAL PTA', 'PIXEL 6A OFFICIAL PTA', 1, 46500, NULL, NULL, 'Official; 3 days check warranty', 'Ahsan Baig 6a Official
3 days check warranty for
battery and software
PIXEL 6A OFFICIAL PTA 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (183, 28, '2025-12-15', 'Ali Pixel 7a Blue Official', '03020832211', FALSE, 'fb5fcc27-ea14-4941-8f65-c6352d80f4ab', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 52000, NULL, NULL, 'Official', 'Ali Pixel 7a Blue Official
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (184, 27, '2025-12-13', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 59000, NULL, NULL, 'Official', 'Waqar G 7 Fazal Centre
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (185, 26, '2025-12-13', 'Faraz Pixel 6 Official', '03324473254', FALSE, 'b02ce0af-5434-4238-90fb-106adbb8eb6c', 'Google', 'pixel 6', 'pixel 6', 1, 55000, NULL, NULL, 'Official; 3 days check warranty', 'Faraz Pixel 6 Official
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (186, 24, '2025-12-12', 'Ashfaq 9a Iris Blue', '03447101515', FALSE, 'd1347e76-b523-4ee6-9b5d-2082c2817f04', NULL, 'cables', 'cables; chargers', 2, 4000, NULL, NULL, NULL, 'Ashfaq 9a Iris Blue
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (187, 23, '2025-12-12', 'Ashfaq 9a Iris Blue', '03447101515', FALSE, 'd1347e76-b523-4ee6-9b5d-2082c2817f04', 'Google', 'pixel 9a', 'pixel 9a', 1, 130000, NULL, NULL, '3 days check warranty', 'Ashfaq 9a Iris Blue
3 days check warranty for
battery and software
pixel 9a 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (188, 25, '2025-12-13', 'Waqar G 7 Fazal Centre', '03216724901', FALSE, '6d74f7c7-ed89-4fb1-9190-f283c0887c6d', 'OnePlus', 'cables', 'cables; OnePlus 13t; chargers', 3, 147000, NULL, NULL, NULL, 'Waqar G 7 Fazal Centre
cables 1 pcs
OnePlus 13t 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (189, 22, '2025-12-11', 'Daniyal 7a Official', '03454313191', FALSE, '8bc21d70-aedd-49e4-87b5-280d7ce32b2e', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 59000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Daniyal 7a Official
official PTA approved 3 days
check warranty for battery and
software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (190, 21, '2025-12-08', 'Hussain Liaqat 8 256gb', '03244807122', FALSE, 'de9a2e4b-cd53-46d6-a543-a0372744b5ce', 'Google', 'cables', 'cables; chargers', 2, 115500, '256GB', NULL, 'Official', 'Hussain Liaqat 8 256gb
Official
cables 1 pcs
chargers 1 pcs
PIXEL 8 official 128gb/256gb
1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (191, 20, '2025-12-07', 'Awais Qadri Pixel 9', '03008434320', FALSE, '32bb1aa2-84a3-4ad4-9fa1-311f6cc42b08', 'Google', 'cables', 'cables; chargers', 2, 3500, NULL, NULL, NULL, 'Awais Qadri Pixel 9
cash recieved
cables 1 pcs
chargers 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (192, 19, '2025-12-06', 'Awais Qadri Pixel 9', '03008434320', FALSE, '32bb1aa2-84a3-4ad4-9fa1-311f6cc42b08', 'Google', 'pixel 9', 'pixel 9', 1, 166000, NULL, NULL, '3 days check warranty', 'Awais Qadri Pixel 9
3 days check warranty for
battery and software
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (193, 18, '2025-12-06', 'Naeem Sb 9 Pro', '03004266612', FALSE, 'c0537085-665f-4766-a795-e089322b6903', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 165000, NULL, NULL, '3 days check warranty', 'Naeem Sb 9 Pro
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (194, 17, '2025-12-06', 'Zylon 8 Pro 256gb', '03052918121', FALSE, '1f875cc0-9938-4561-adef-ef3ef15acd6e', 'Google', 'pixel 8', 'pixel 8', 1, 105000, '256GB', NULL, 'Official; PTA Approved; CPID; Exchange/Adjustment; Received: 60k recieved', 'Zylon 8 Pro 256gb
pixel 7 CPID adjusted in 45k
60k recieved online it''s official
PTA approved
PIXEL 8 official 128gb/256gb
1 pcs', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (195, 16, '2025-12-06', 'Arslan Pixel 9a Box Pack', '03009777791', FALSE, '7e43b83e-b7c1-476c-863d-f84855171bc4', 'Google', 'pixel 9a', 'pixel 9a', 1, 130000, NULL, NULL, 'Brand new/Box pack', 'Arslan Pixel 9a Box Pack
brand new box pack
pixel 9a 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (196, 15, '2025-12-05', 'Hassan Ateeq Pixel 8 HAZEL', '03358855690', FALSE, 'f549be26-3038-4cf5-8452-d01a7ce4de72', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 82000, NULL, NULL, 'CPID; 3 days check warranty', 'Hassan Ateeq Pixel 8 HAZEL
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (197, 14, '2025-12-05', 'M Irfan 7 Official White', '03456680016', FALSE, '02a4ee17-58b4-46dd-a87d-40168ec5d355', 'Google', 'cables', 'cables; chargers', 2, 66000, '256GB', NULL, 'Official; PTA Approved; 3 days check warranty', 'M Irfan 7 Official White
official PTA approved 3 days
check warranty for battery and
software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (198, 13, '2025-12-05', 'Haris 7 Pro Buyer', '03008405607', FALSE, 'c0134359-ff96-49f5-81fe-1749b1f576e7', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 55000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Haris 7 Pro Buyer
3 days check warranty for
battery official PTA approved
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (199, 12, '2025-12-05', 'Jahanzeb 6 Pro Official', '03004880875', FALSE, '88db9797-9735-4276-950e-c4299b7dff2c', 'Google', 'PIXEL 6A OFFICIAL PTA', 'PIXEL 6A OFFICIAL PTA', 1, 45000, NULL, NULL, 'Official; 3 days check warranty', 'Jahanzeb 6 Pro Official
3 days check warranty for
battery and software
PIXEL 6A OFFICIAL PTA 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (200, 11, '2025-12-04', 'Ali Hamza 7 Pro Official Black', '03231955361', FALSE, '75ade273-14ab-4f3a-98bc-8c8c42a34964', 'Google', 'pixel 7 pro official', 'pixel 7 pro official', 1, 92500, NULL, NULL, 'Official; 3 days check warranty', 'Ali Hamza 7 Pro Official Black
3 days check warranty for
battery and software
pixel 7 pro official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (201, 10, '2025-12-03', 'Umar Raja Old Student 2002', '03218880209', FALSE, '90d533a6-6891-457e-abb1-7f913cfb24a7', 'Google', 'cables', 'cables; chargers', 2, 74000, '256GB', NULL, 'Official; PTA Approved; 3 days check warranty', 'Umar Raja Old Student 2002
Batch
official PTA approved 3 days
check warranty for battery and
software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (202, 9, '2025-12-03', 'Kumail Naqvi Pixel 8 Official', '03008851124', FALSE, 'a6c516f7-3cca-4654-adb1-abb0f0c40300', 'Google', 'pixel 8', 'pixel 8', 1, 115000, NULL, NULL, 'Brand new/Box pack; Official; PTA Approved', 'Kumail Naqvi Pixel 8 Official
box pack official PTA approved', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (203, 8, '2025-12-03', 'Rai Bilawal 7a Official', '03020444973', FALSE, 'f4fa2938-f3ee-450e-a0ca-2d8b90355728', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 59000, NULL, NULL, 'Official; 3 days check warranty', 'Rai Bilawal 7a Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (204, 7, '2025-12-01', 'Nadeem 8 Pro 256gb', '03219449788', FALSE, 'ec58aa46-385f-44f1-90cd-da31ab4d984b', NULL, NULL, NULL, 0, 82000, '256GB', NULL, 'Official; PTA Approved; 3 days check warranty', 'Nadeem 8 Pro 256gb
official PTA approved 3 days
check warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (205, 4, '2025-11-30', 'Me', '03214495590', FALSE, '52b93163-4ec7-4730-a9cf-e710d3cb003e', 'Google', 'pixel 7', 'pixel 7', 1, 65000, '256GB', NULL, 'Official', 'Me
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (206, 3, '2025-11-30', 'Zulfiqar Ali LG 20 Hafeez', '03225874449', FALSE, 'e8b384a5-9ad9-41d0-b129-1e5610de867e', NULL, NULL, NULL, 0, 207000, NULL, NULL, '3 days check warranty', 'Zulfiqar Ali LG 20 Hafeez
Centre
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (207, 2, '2025-11-30', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', 'Google', 'pixel 7', 'pixel 7', 1, 64000, '256GB', NULL, 'Official', 'Hanzala Iftikhar
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (208, 1, '2025-11-30', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', NULL, NULL, NULL, 0, 38000, NULL, NULL, '3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (209, 6, '2025-12-01', 'Bilal Shah Shop 3 Fazal Trade', '03224555355', FALSE, '267c6ed8-5994-41da-9841-a4719ff77433', 'Google', 'buds pro 2', 'buds pro 2', 1, 29000, NULL, NULL, NULL, 'Bilal Shah Shop 3 Fazal Trade
Centre
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (210, 23, '2025-11-29', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', NULL, NULL, NULL, 0, 53000, NULL, NULL, '3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (211, 22, '2025-11-29', 'Subhan Pixel 7a Official', '03054662567', FALSE, 'fd8bc195-174d-4826-b95f-82f2fc534359', 'Google', 'cables', 'cables; chargers', 2, 60000, NULL, NULL, 'Official; PTA Approved', 'Subhan Pixel 7a Official
official PTA approved
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (212, 21, '2025-11-28', 'Farhan Pixel 7 Pro White', '03136173959', FALSE, '79bc0f53-c07d-4d8a-a344-cdc2cb993c6a', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta; cables; chargers', 3, 79000, NULL, NULL, 'Non-PTA', 'Farhan Pixel 7 Pro White
Pixel 7 pro non pta 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (213, 20, '2025-11-27', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'pixel 8 pro 256 official', 'pixel 8 pro 256 official', 1, 134500, NULL, NULL, 'Official', 'Hamza IT Tower G 15
pixel 8 pro 256 official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (214, 19, '2025-11-27', 'Fahad Raza Khan 8 Pro Official', '03218810900', FALSE, '4e03a9c8-6e9a-4d7d-902c-d11f9b323f26', 'Google', 'cables', 'cables; chargers; pixel 8 pro 256 official', 3, 140000, NULL, NULL, 'Official; 3 days check warranty', 'Fahad Raza Khan 8 Pro Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 8 pro 256 official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (215, 18, '2025-11-26', 'Irfan Ahmad 6 Pro 512gb', '03032690143', FALSE, '43c28e1d-8bf8-4a4b-a516-1315cd146355', NULL, 'cables', 'cables; chargers', 2, 86500, '512GB', NULL, NULL, 'Irfan Ahmad 6 Pro 512gb
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (216, 17, '2025-11-25', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', 'Google', 'cables', 'cables; chargers; pixel 9', 3, 144000, NULL, NULL, '3 days check warranty', 'Adnan MZ Mobile
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (217, 16, '2025-11-25', 'Sharjeel Pixel 9 Green', '03356599115', FALSE, 'd85d5ab9-7b55-4858-b873-188b4e31fda0', 'Google', 'cables', 'cables; chargers; pixel 9', 3, 144000, NULL, NULL, '3 days check warranty', 'Sharjeel Pixel 9 Green
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (218, 5, '2025-12-01', 'Sarim Shakeel', '03345938535', FALSE, 'f13833ff-f1c4-46ca-abea-0c4b53e9f4c4', 'Google', 'pixel 7', 'pixel 7', 1, 66000, '256GB', NULL, 'Official', 'Sarim Shakeel
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (219, 15, '2025-11-24', 'Kamran Tahir 9A', '03362823938', FALSE, '9971b6b0-a08c-410d-89c1-46d49698a681', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; buds pro 1', 3, 205000, NULL, NULL, 'Exchange/Adjustment; Received: 110k
recieved', 'Kamran Tahir 9A
9a adjusted in 95k 110k
recieved online
Pixel 9 pro XL 1 pcs
cables 1 pcs
buds pro 1 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (220, 14, '2025-11-22', 'Sultan Pixel 7 Buyer', '03218425662', FALSE, 'bf3e2dc3-ed6b-41b1-a46f-b3eff5e936e8', 'Google', 'cables', 'cables; chargers', 2, 66500, '256GB', NULL, 'Official; 3 days check warranty', 'Sultan Pixel 7 Buyer
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (221, 13, '2025-11-21', 'Faisal 7 Pro', '03201443268', FALSE, '20bcd399-3ad3-4a0d-aef3-7c0c336ac058', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official; cables; chargers', 3, 132000, '128GB', NULL, 'Official', 'Faisal 7 Pro
pixel 8 pro 128gb official 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (222, 12, '2025-11-21', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', NULL, NULL, NULL, 0, 240000, NULL, NULL, 'Brand new/Box pack', 'Adnan MZ Mobile
brand new box pack JV', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (223, 10, '2025-11-18', 'Arbab Raza 7 Pro White', '03016932041', FALSE, '6a2f0e28-c198-4735-ac73-6eb5abf05028', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; chargers x2; pixel 9a; pixel 7a official', 5, 400000, NULL, NULL, 'Official', 'Arbab Raza 7 Pro White
Demand
Pixel 9 pro XL 1 pcs
chargers 2 pcs
pixel 9a 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (224, 9, '2025-11-18', 'Umar Bilal Buds Pro 2', '03455005046', FALSE, '6804bc6e-f8de-4490-935b-0691078ce4dd', 'Google', 'buds pro 2', 'buds pro 2', 1, 30000, NULL, NULL, NULL, 'Umar Bilal Buds Pro 2
open box
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (225, 8, '2025-11-17', 'Usama Ali Pixel 9 Black', '03136333660', FALSE, '5f364214-11f3-4992-aaeb-9fe05b11a15a', 'Google', 'pixel 9', 'pixel 9', 1, 135000, NULL, NULL, '3 days check warranty', 'Usama Ali Pixel 9 Black
3 days check warranty for
battery and software
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (226, 7, '2025-11-17', 'Qamar Watch And Buds', '03079400285', FALSE, '58f6b253-064d-4841-99d5-ab48dc63dac9', 'Google', 'buds pro 1', 'buds pro 1; pixel 9', 2, 174000, NULL, NULL, '3 days check warranty', 'Qamar Watch And Buds
3 days check warranty for
battery and software
buds pro 1 1 pcs
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (227, 6, '2025-11-14', 'Zulfiqar Ali LG 20 Hafeez', '03225874449', FALSE, 'e8b384a5-9ad9-41d0-b129-1e5610de867e', NULL, NULL, NULL, 0, 57000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Zulfiqar Ali LG 20 Hafeez
Centre
official PTA approved 3 days
check warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (228, 5, '2025-11-13', 'Ahsan Shaikh 6 Pro Buyer', '03214722233', FALSE, '7b1a9857-f419-44e0-98d0-e4c2a79fc26c', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 235000, NULL, NULL, '3 days check warranty', 'Ahsan Shaikh 6 Pro Buyer
3 days check warranty for
battery and software price is
inclusive of box box is
returnable on payment of 5k
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (229, 4, '2025-11-13', 'Bilal 6 Pro CPID Black', '03224035665', FALSE, '9d13a3bf-b4e4-4095-bc41-fda9dd3c731b', NULL, NULL, NULL, 0, 61000, NULL, NULL, 'CPID; 3 days check warranty', 'Bilal 6 Pro CPID Black
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (230, 3, '2025-11-12', 'Saad Pixel 8 Pro Black', '03357120660', FALSE, 'f5edc15b-950a-472e-b26c-4684ccc9f831', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 95000, NULL, '355522573444662', '3 days check warranty', 'Saad Pixel 8 Pro Black
3 days check warranty for
battery and software
355522573444662', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (231, 2, '2025-11-12', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 81000, NULL, NULL, 'CPID', 'Mudassir Kalpay
CPID process done
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (232, 1, '2025-11-12', 'Fahad Butt G 07', '03224011666', FALSE, '28d138a9-5124-4dc1-90f4-915eff14c71e', NULL, NULL, NULL, 0, 47000, NULL, NULL, NULL, 'Fahad Butt G 07', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (233, 87, '2025-11-11', 'Haroon Pixel 8 Pro CPID', '03245419388', FALSE, 'c36aabd1-baae-43b1-b997-10a6921866a3', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 99000, NULL, '352499093821252', 'CPID; 3 days check warranty', 'Haroon Pixel 8 Pro CPID
3 days check warranty for
battery and software
352499093821252', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (234, 86, '2025-11-10', 'Arvo Kamran', '03034565618', FALSE, 'd43418eb-6bea-4d65-ad7f-50f880ad7024', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 66000, '256GB', NULL, 'Non-PTA; Exchange/Adjustment', 'Arvo Kamran
9 pro XL 256gb white non PTA
sim time over adjusted in
exchange
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (235, 85, '2025-11-10', 'Hashaam Pixel 9 Bahria Town', '03341122218', FALSE, '996c7392-795a-41e4-a724-2357912c7ec3', 'Google', 'pixel 9 pro xl', 'pixel 9 pro xl', 1, 285000, NULL, NULL, 'Exchange/Adjustment', 'Hashaam Pixel 9 Bahria Town
pixel 9 pro XL adjusted in 155k', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (236, 84, '2025-11-08', 'Awais Pixel 8 Pro Official', '03029855623', FALSE, 'e53e34f2-9e88-40da-bbdf-af8105f10818', 'Google', 'pixel 8 pro 256 official', 'pixel 8 pro 256 official', 1, 140000, NULL, NULL, 'Official', 'Awais Pixel 8 Pro Official
price inclusive of charger and
cable
pixel 8 pro 256 official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (237, 83, '2025-11-08', 'Faisal 7 Pro', '03201443268', FALSE, '20bcd399-3ad3-4a0d-aef3-7c0c336ac058', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 245500, NULL, NULL, '3 days check warranty', 'Faisal 7 Pro
price inclusive of back cover
back sheet charger cable front
glass 3 days check warranty
for battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (238, 82, '2025-11-08', 'Abdullah Pixel 7 Official', '03131522642', FALSE, 'fe3b2f6e-468b-452c-97b5-faccc6db03cb', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official; 3 days check warranty', 'Abdullah Pixel 7 Official
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (239, 81, '2025-11-07', 'Irtaza Chaudhry 7a White', '03477243727', FALSE, '3f214b7e-6da3-48cb-a51d-7ebc1bb7b296', NULL, NULL, NULL, 0, 49000, NULL, NULL, '3 days check warranty', 'Irtaza Chaudhry 7a White
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (24, 80, '2025-11-07', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 75000, NULL, NULL, 'CPID', 'Ali Rana
Tower
✨   Sarwar G 15 IT
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (241, 79, '2025-11-07', 'Arshad Aluminum Pixel 6a', '03324904123', FALSE, '6da5a40b-7c3d-49c7-b815-a221e3baa050', 'Google', 'PIXEL 6A OFFICIAL PTA', 'PIXEL 6A OFFICIAL PTA', 1, 47000, NULL, NULL, 'Official; 3 days check warranty', 'Arshad Aluminum Pixel 6a
Official
3 days check warranty for
battery and software
PIXEL 6A OFFICIAL PTA 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (242, 78, '2025-11-07', 'Shaban Pixel 7 Black Official', '03015156534', FALSE, '488e8d85-f33d-42ed-a278-136f2dadd79a', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official; 3 days check warranty', 'Shaban Pixel 7 Black Official
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (243, 77, '2025-11-07', 'Masood 7a Official Blue', '03234042199', FALSE, '0dd8bca1-03b8-496e-b96d-ac63099cf184', 'Google', 'cables', 'cables; chargers; pixel 7a official', 3, 63000, NULL, NULL, 'Official; 3 days check warranty', 'Masood 7a Official Blue
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (244, 76, '2025-11-06', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 81000, NULL, NULL, 'Non-PTA; CPID; 3 days check warranty', 'Haris
sold to hashir brother of
moeez non PTA 3 days check
warranty for battery and
software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (245, 75, '2025-11-06', 'Khusnood Unique Mobile', '03234430678', FALSE, '660b30bc-6209-4c0e-98c5-f7db7f8e33e4', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 180000, '256GB', NULL, 'Non-PTA', 'Khusnood Unique Mobile
pixel 9 pro 256gb rose quartz
non PTA
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (246, 74, '2025-11-06', 'Majid MS Mobile Nishat', '03114744288', FALSE, 'b110c0a8-8631-461e-b703-edde9534d571', 'Google', 'pixel 7', 'pixel 7', 1, 65000, '256GB', NULL, 'Official; 3 days check warranty', 'Majid MS Mobile Nishat
Colony
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (247, 73, '2025-11-06', 'Waqas 7a Official Black', '03265207895', FALSE, '5afeb034-19e6-42ad-84d1-6089dbeec9e2', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 56000, NULL, NULL, 'Official; 3 days check warranty', 'Waqas 7a Official Black
3 days check warranty for
battery and software
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (248, 72, '2025-11-05', 'Adeel Siddiqui 7 And 7a', '03213868686', FALSE, 'c2bb377c-ca66-4cea-bd8e-33f6a52e3695', 'Google', 'pixel 7a official', 'pixel 7a official', 1, 125000, '256GB', NULL, 'Official; PTA Approved; 3 days check warranty', 'Adeel Siddiqui 7 And 7a
official PTA approved 3 days
check warranty for battery and
software
pixel 7 official 128gb/256gb 1
pcs
pixel 7a official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (249, 71, '2025-11-05', 'Rabia Baig 9 PRO XL Official', '03244723912', FALSE, '0494f4b6-4946-481c-8ca4-294db105e807', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 155000, '128GB', NULL, 'Official; PTA Approved; CPID; Exchange/Adjustment', 'Rabia Baig 9 PRO XL Official
in exchange with pixel 8 PRO
12GB 128gb cpid black 9 pro
XL is official PTA approved
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (250, 70, '2025-11-03', 'Shaikh Ansar 9 Pro XL', '03454634759', FALSE, 'd4740864-4fc1-417c-9cbf-16e3e159edfb', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 235000, NULL, NULL, NULL, 'Shaikh Ansar 9 Pro XL
price inclusive of charger
cable front glass back cover
and camera protector
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (251, 69, '2025-11-03', 'Yasir Care Of Haris', '03457619009', FALSE, 'a4aa28f4-d20d-494a-9a87-66ccf17fb6dc', 'Google', 'cables', 'cables; chargers; pixel 9 pro', 3, 170000, NULL, NULL, 'CPID', 'Yasir Care Of Haris
CPID expense front glass back
cover complementary
cables 1 pcs
chargers 1 pcs
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (252, 68, '2025-11-01', 'Hasnain 9 Pro XL White', '03281792664', FALSE, '8f058503-bf5e-48d1-88d9-6d96a5d1b782', 'Google', 'buds pro 1', 'buds pro 1', 1, 13000, NULL, NULL, NULL, 'Hasnain 9 Pro XL White
buds pro 1 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (253, 67, '2025-11-01', 'Basit LG 39 Care Of Husnain', '03047228829', FALSE, 'ba94c776-f229-4cbf-b22b-cbab7aaff484', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 137000, '128GB', '355522572915100', 'Official; PTA Approved', 'Basit LG 39 Care Of Husnain
Repair
official PTA approved
355522572915100-5118
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (254, 66, '2025-10-31', 'Saud 7a White', '03314031901', FALSE, '2a23b97e-7273-4f04-899f-c472a271cfe8', NULL, NULL, NULL, 0, 55000, NULL, NULL, '3 days check warranty', 'Saud 7a White
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (255, 65, '2025-10-31', 'Umair S 24 Plus Buyer', '03216430580', FALSE, '8bb16872-e906-4530-aeac-3a9b23663a4f', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 240000, NULL, NULL, '3 days check warranty', 'Umair S 24 Plus Buyer
Gujranwala
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (256, 64, '2025-10-30', 'Aadil Pixel 6a Approved', '03304147744', FALSE, 'c963dd26-43a6-4fdd-a1c0-79ea40819c01', 'Google', 'pixel 6a', 'pixel 6a', 1, 44000, NULL, NULL, '3 days check warranty', 'Aadil Pixel 6a Approved
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (257, 63, '2025-10-29', 'Husnain Hameed 9 Pro Box', '03156105744', FALSE, 'f6d52fc4-c9be-48c3-b954-0e1d9bdd5f45', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 190000, NULL, NULL, 'CPID', 'Husnain Hameed 9 Pro Box
Pack
price inclusive of CPID
process back cover back sheet
and front galss
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (258, 62, '2025-10-29', 'Waris Pixel 9 Pink', '03233339364', FALSE, '1fd48013-18ba-4734-8bb3-f5b41fee4e08', 'Google', 'pixel 9', 'pixel 9', 1, 133000, NULL, NULL, '3 days check warranty', 'Waris Pixel 9 Pink
3 days check warranty for
battery and software
pixel 9 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (259, 61, '2025-10-28', 'Syed Salman G 43 IT Tower', '03034123459', FALSE, '28311181-3438-401f-a71c-ec6b4bf35edb', 'Google', 'pixel 7', 'pixel 7', 1, 61000, '256GB', NULL, 'Official; 3 days check warranty', 'Syed Salman G 43 IT Tower
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (260, 60, '2025-10-28', 'Danish Pixel 6 Official', '03020014620', FALSE, '4c699bba-16a2-4acc-b769-76924359134d', 'Google', 'cables', 'cables; chargers', 2, 56000, NULL, NULL, 'Official; 3 days check warranty', 'Danish Pixel 6 Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (261, 59, '2025-10-28', 'Zunair 9 Pro XL Hazel', '03021010327', FALSE, 'fed293a1-e805-403d-9542-f6f71ac150cb', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 225000, NULL, NULL, '3 days check warranty', 'Zunair 9 Pro XL Hazel
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (262, 58, '2025-10-27', 'Iraj Raza 9 Pro 128gb Black', '03244247389', FALSE, '42b11d51-6507-4cb9-b7ae-9266d136772e', 'Google', 'cables', 'cables; chargers; pixel 9 pro', 3, 183000, '128GB', NULL, NULL, 'Iraj Raza 9 Pro 128gb Black
cables 1 pcs
chargers 1 pcs
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (263, 57, '2025-10-27', 'Jahanzeb Manjh', '03008426642', FALSE, '6373c8dd-3014-4770-968e-57f39575d7f8', NULL, NULL, NULL, 0, 52000, NULL, NULL, 'CPID; Has remaining balance', 'Jahanzeb Manjh
price inclusive of wrapping
cpid PTA tax and front glass
cash recieved 33500 rupees
balance amount 18500 only', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (264, 56, '2025-10-27', 'Abdullah Jamshaid', '03228427066', FALSE, '4f46c26a-a0b8-45ce-a4d7-66b3dcb90ab9', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL x2', 2, 440000, NULL, NULL, NULL, 'Abdullah Jamshaid
Pixel 9 pro XL 2 pcs', 'WARNING', 'Multi-qty (2 pcs) — per-unit price unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (265, 55, '2025-10-25', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 80000, '256GB', NULL, 'Non-PTA', 'Hamza IT Tower G 15
256gb black
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (266, 54, '2025-10-25', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 198000, '256GB', NULL, 'Official; Non-PTA', 'Hamza IT Tower G 15
Pixel 7 pro non pta 1 pcs
pixel 7 official 128gb/256gb 2
pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (267, 53, '2025-10-25', 'Main M Saleem 7a Official', NULL, TRUE, '27f559a5-8472-470a-9e29-818e052922ac', 'OnePlus', 'OnePlus 13t', 'OnePlus 13t', 1, 226000, '512GB', NULL, 'Official; PTA Approved; Discount: 6k discount; Has remaining balance; Received: 130k
recieved', 'Main M Saleem 7a Official
official PTA approved dual sim
tax paid 16gb 512gb dual
physical 6k discount 130k
recieved 90k balance
OnePlus 13t 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (268, 52, '2025-10-23', 'Hamid Pixel 7 256gb', '03324107927', FALSE, 'b216247a-3c87-422d-92db-9683f667b1e7', 'Google', 'cables', 'cables; chargers', 2, 77000, '256GB', NULL, '3 days check warranty', 'Hamid Pixel 7 256gb
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (269, 51, '2025-10-22', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', NULL, NULL, NULL, 0, 21000, NULL, NULL, NULL, 'Zain 7a Buyer Iqbal Town', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (270, 50, '2025-10-22', 'Main M Saleem 7a Official', NULL, TRUE, '27f559a5-8472-470a-9e29-818e052922ac', NULL, NULL, NULL, 0, 60000, NULL, NULL, 'Official; 3 days check warranty', 'Main M Saleem 7a Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (271, 49, '2025-10-22', 'Mudassir s 22 Ultra', '03094491119', FALSE, 'd58ca862-fb73-4c84-835f-4a7ed5059d88', 'Samsung', 's 22 ultra', 's 22 ultra', 1, 145000, NULL, NULL, NULL, 'Mudassir s 22 Ultra', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (272, 48, '2025-10-22', 'Asad Hafeez Buds Pro 2', '03318746850', FALSE, '5bbba662-9b03-494d-a58e-300692853108', 'Google', 'buds pro 2', 'buds pro 2', 1, 30000, NULL, NULL, NULL, 'Asad Hafeez Buds Pro 2
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (273, 47, '2025-10-22', 'Huzaifa Iftekhar Gujranwala', '03435305445', FALSE, '12e25c1a-7167-458b-95b1-cb02e9ced8cf', 'Google', 'buds pro 1', 'buds pro 1', 1, 14500, NULL, NULL, NULL, 'Huzaifa Iftekhar Gujranwala
buds pro 1 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (274, 46, '2025-10-22', 'Zulfiqar Ali LG 20 Hafeez', '03225874449', FALSE, 'e8b384a5-9ad9-41d0-b129-1e5610de867e', 'Google', 'cables', 'cables; chargers; pixel 9a', 3, 142000, NULL, NULL, NULL, 'Zulfiqar Ali LG 20 Hafeez
Centre
cables 1 pcs
chargers 1 pcs
pixel 9a 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (275, 45, '2025-10-21', 'Malik Zain Pixel 7 White', '03004285851', FALSE, '5334f185-57a1-4943-8038-d51f49ede9dd', 'Google', 'pixel 7', 'pixel 7', 1, 63000, '256GB', NULL, 'Official; 3 days check warranty', 'Malik Zain Pixel 7 White
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (276, 44, '2025-10-20', 'Sameer Ahmad Pixel 8', '03155600705', FALSE, '98f47edd-7705-4ac7-b477-4102e140a9bb', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 76000, NULL, NULL, 'CPID; 3 days check warranty', 'Sameer Ahmad Pixel 8
3 days check warranty for
battery and software phone
can be updated and can be
reset
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (277, 43, '2025-10-18', 'Sajid Sb 7a Official', '03309356022', FALSE, 'edc9c5d3-2c3e-45a0-9f67-00312e2cb8d0', NULL, NULL, NULL, 0, 95000, NULL, NULL, 'Official; 3 days check warranty', 'Sajid Sb 7a Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (278, 41, '2025-10-18', 'Ammar 9 Pro 256gb', '03238405109', FALSE, 'fb33a8b9-5ca4-4713-b610-da359cbe7eb0', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 188000, '256GB', NULL, '3 days check warranty', 'Ammar 9 Pro 256gb
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (279, 40, '2025-10-16', 'Qadir Ali 6A Official', '03268858883', FALSE, 'ca7bb0b6-4d5a-489e-ac1a-99e0d9130ae6', 'Google', 'PIXEL 6A OFFICIAL PTA', 'PIXEL 6A OFFICIAL PTA', 1, 49000, NULL, NULL, 'Official; 3 days check warranty', 'Qadir Ali 6A Official
3 days check warranty for
battery and software
PIXEL 6A OFFICIAL PTA 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (280, 38, '2025-10-16', 'Abuzar Pixel 7 Pro', '03344135041', FALSE, 'b17476fb-c76d-4823-8ad8-b4068b6217f3', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 73000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Abuzar Pixel 7 Pro
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (281, 37, '2025-10-16', 'Javaid Shah Pixel 7 Official', '03008803757', FALSE, '972e344b-cff0-45e7-8971-8a6c7f299b9a', 'Google', 'pixel 7', 'pixel 7', 1, 62000, '256GB', NULL, 'Official; 3 days check warranty', 'Javaid Shah Pixel 7 Official
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (282, 36, '2025-10-16', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, NULL, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Ali Rana
Tower
✨   Sarwar G 15 IT           70,000
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'ERROR', 'No amount found');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (283, 35, '2025-10-16', 'Ramish 8 Pro Buyer', '03004918580', FALSE, 'f374d63f-b28e-4a31-a77c-26bf9a290755', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 190000, NULL, NULL, '3 days check warranty', 'Ramish 8 Pro Buyer
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (284, 34, '2025-10-14', 'Aqib Pixel 7a Official', '03224718090', FALSE, '0523dff5-7d45-4f60-8497-9f21dbf42e97', 'Google', 'cables', 'cables; chargers', 2, 66500, NULL, NULL, 'Official; 3 days check warranty', 'Aqib Pixel 7a Official
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (285, 33, '2025-10-14', 'Nadeem Pixel 6a', '03445672411', FALSE, '2427c0e2-d526-4cc5-b669-fddefa383486', 'Google', 'pixel 6a', 'pixel 6a', 1, 44000, NULL, NULL, '3 days check warranty', 'Nadeem Pixel 6a
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (286, 32, '2025-10-14', 'Rana Qasim Pixel 8 Pro', '03214875592', FALSE, 'e59fe697-d4e4-428d-aced-cc472997c8cc', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 95000, NULL, NULL, '3 days check warranty', 'Rana Qasim Pixel 8 Pro
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (287, 31, '2025-10-14', 'Saad Raja Diamond Foam', '03229001212', FALSE, 'e2502cd5-6c6a-45eb-922f-4e73f9366bfd', NULL, 'cables', 'cables; chargers', 2, 5000, NULL, NULL, NULL, 'Saad Raja Diamond Foam
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (288, 30, '2025-10-14', 'Farhan Baloch DGK', '03347211123', FALSE, 'a3595c4a-6ce1-4686-9f92-d7bf04dbc591', 'Google', 'pixel 7', 'pixel 7', 1, 65000, '256GB', NULL, 'Official; 3 days check warranty', 'Farhan Baloch DGK
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (289, 29, '2025-10-14', 'Husnain Pixel 9 Pro XL', '03079388889', FALSE, '354eed66-c835-4600-a5c5-46e87d121f65', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 230000, NULL, NULL, '3 days check warranty', 'Husnain Pixel 9 Pro XL
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (290, 28, '2025-10-14', 'Saad Raja Diamond Foam', '03229001212', FALSE, 'e2502cd5-6c6a-45eb-922f-4e73f9366bfd', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 190000, NULL, NULL, '3 days check warranty', 'Saad Raja Diamond Foam
3 days check warranty for
battery and software
pixel 9 pro 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (291, 27, '2025-10-13', 'Abdul Ahad Pixel 6 256gb', '03112603011', FALSE, '2156c7cd-3aa6-4713-87fe-91aeb5d4d17a', 'Google', 'cables', 'cables; chargers', 2, 62000, '256GB', NULL, '3 days check warranty', 'Abdul Ahad Pixel 6 256gb
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (292, 26, '2025-10-13', 'Saad Pixel 8 Hazel', '03164388112', FALSE, 'd2fb2501-e19e-4500-b785-147551b2f95d', 'Google', 'cables', 'cables; chargers', 2, 69000, '256GB', NULL, 'Official; 3 days check warranty', 'Saad Pixel 8 Hazel
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (293, 24, '2025-10-11', 'Khateeb Mirza Ehsan Mobile', '03004257869', FALSE, 'f0c78eb9-ff30-4220-9bac-25dd98cf477d', NULL, NULL, NULL, 0, 34500, NULL, NULL, NULL, 'Khateeb Mirza Ehsan Mobile', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (294, 23, '2025-10-11', 'Faisal G 05 Venus Mobile', '03227474720', FALSE, '355cb734-3a4e-4fce-a877-009255c879b3', NULL, NULL, NULL, 0, 53500, NULL, NULL, '3 days check warranty', 'Faisal G 05 Venus Mobile
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (295, 22, '2025-10-11', 'Mustafa G 20 Hassan Tower', '03234391920', FALSE, '8df4b6fe-5847-45b2-b330-50d2dd83a1cf', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 265000, NULL, NULL, 'Official; PTA Approved', 'Mustafa G 20 Hassan Tower
official PTA approved with
complete box
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (296, 21, '2025-10-11', 'Ibraheem Javed Pixel 7 Pro', '03235789789', FALSE, 'cbf477ed-d1cd-44fc-bc63-22af23a654c4', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 80000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Ibraheem Javed Pixel 7 Pro
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (297, 20, '2025-10-11', 'Hamza Pixel 9 Pink', '03174010170', FALSE, '0ab8908a-6689-4bf4-b6fb-d995e0492ed2', 'Google', 'cables', 'cables; chargers', 2, 146000, NULL, NULL, '3 days check warranty', 'Hamza Pixel 9 Pink
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (298, 19, '2025-10-11', 'Ali Pixel 8 Buds', '03090332049', FALSE, 'c451cd1d-7825-4dd3-b895-20d051dc3af6', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID; cables; buds pro 1; chargers', 4, 105000, NULL, NULL, 'CPID; 3 days check warranty', 'Ali Pixel 8 Buds
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs
cables 1 pcs
buds pro 1 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (299, 18, '2025-10-10', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', 'Google', 'Pixel 10', 'Pixel 10', 1, 258000, NULL, NULL, NULL, 'Basit Straight Way IT Tower
Pixel 10 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (300, 17, '2025-10-09', 'Asfandyar Sabri', '03177905163', FALSE, '3ea1888d-1534-42b3-994a-61fb808d301a', NULL, 'cables', 'cables; chargers', 2, 76000, NULL, NULL, '3 days check warranty', 'Asfandyar Sabri
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (301, 16, '2025-10-09', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', NULL, NULL, NULL, 0, 43000, NULL, NULL, NULL, 'Ali Rana
Tower
✨   Sarwar G 15 IT', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (302, 15, '2025-10-09', 'Zulfiqar Ali LG 20 Hafeez', '03225874449', FALSE, 'e8b384a5-9ad9-41d0-b129-1e5610de867e', NULL, NULL, NULL, 0, 65000, NULL, NULL, NULL, 'Zulfiqar Ali LG 20 Hafeez
Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (303, 13, '2025-10-07', 'Ali Hamza 7 Pro White FSD', '03127630877', FALSE, '68365572-d8f9-4266-abe2-92e9c814fd45', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 75000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Ali Hamza 7 Pro White FSD
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (304, 12, '2025-10-17', 'Imran Bhai G 05', '03004201164', FALSE, 'e3bb8a50-276c-4766-b784-01e92538272a', NULL, NULL, NULL, 0, 297000, NULL, NULL, NULL, 'Imran Bhai G 05', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (305, 11, '2025-10-05', 'Qasim M 3 IT Tower', '03234447402', FALSE, '52a1e7ed-5e05-4ba2-ab7d-edf64bfc61f9', NULL, NULL, NULL, 0, 68000, NULL, NULL, '3 days check warranty', 'Qasim M 3 IT Tower
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (306, 10, '2025-10-04', 'Usman Khan Pixel 8', '03163828220', FALSE, '4a134b74-6c62-4511-a434-04222ec3f9a1', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID; cables; chargers', 3, 87500, NULL, NULL, 'CPID; 3 days check warranty', 'Usman Khan Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (307, 9, '2025-10-04', 'Yasir Care Of Haris', '03457619009', FALSE, 'a4aa28f4-d20d-494a-9a87-66ccf17fb6dc', NULL, NULL, NULL, 0, 285000, NULL, NULL, 'CPID', 'Yasir Care Of Haris
CPID done tax paid PTA
approved', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (308, 8, '2025-10-04', 'Shams UrRehman 7 Pro 256gb', '03128300923', FALSE, '83278b43-6444-4c62-a3dc-1bccedd73fb7', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 86000, '256GB', NULL, 'Non-PTA; 3 days check warranty', 'Shams UrRehman 7 Pro 256gb
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (309, 7, '2025-10-03', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', NULL, NULL, NULL, 0, 58000, NULL, NULL, '3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (310, 6, '2025-10-03', 'Ayyan Pixel 8 Pro White', '03134826437', FALSE, 'a44f5d04-f153-4dbb-98ad-0b0c4a69ead6', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 115000, NULL, NULL, '3 days check warranty', 'Ayyan Pixel 8 Pro White
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (311, 5, '2025-10-02', 'Ehtisham Ur Rehman 8 Pro', '03114644470', FALSE, '8af9b8ed-4358-4660-8652-e049d4b1b41e', NULL, 'cables', 'cables; chargers', 2, 120000, NULL, NULL, NULL, 'Ehtisham Ur Rehman 8 Pro
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (312, 4, '2025-10-02', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, NULL, NULL, 0, 26000, NULL, NULL, NULL, 'Hanzala Iftikhar', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (313, 3, '2025-10-02', 'Asad Abrar CM Office 8 Pro', '03334275334', FALSE, '50906cf4-c9db-4fee-b65c-16747f4bcafb', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 220000, NULL, NULL, 'Exchange/Adjustment', 'Asad Abrar CM Office 8 Pro
Buyer
exchange with S 22 ULTRA
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (314, 2, '2025-10-01', 'Zeeshan 7 Pro Lawyer', '03114641676', FALSE, '2b18bbdc-2886-418c-8caf-19fd4ee192f3', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta; cables; chargers', 3, 80000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Zeeshan 7 Pro Lawyer
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (315, 1, '2025-09-30', 'Arslan Pixel 8', '03045927721', FALSE, 'ba65ee08-8f70-48a5-9188-7c2ee4545105', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 83500, NULL, NULL, 'CPID; 3 days check warranty', 'Arslan Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (316, 129, '2025-09-30', 'Akhlaq Pixel 8 Black', '03189024490', FALSE, '7d5de697-5469-4e3c-b071-257d823911e2', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 86000, NULL, NULL, 'CPID', 'Akhlaq Pixel 8 Black
price inclusive of charger
cable front glass back cover
cpid process and PTA tax
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (317, 128, '2025-09-27', 'Shahzaib 9 Pro XL', '03204056366', FALSE, '721beba5-dbc8-4de3-901e-08ccd5f12228', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 208000, NULL, NULL, '3 days check warranty', 'Shahzaib 9 Pro XL
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (318, 127, '2025-09-27', 'Usman Butt Pixel 8', '03217729251', FALSE, 'ee03d5ad-66b2-4ff3-b5ca-02e5f639cb7b', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 75000, NULL, NULL, 'CPID; 3 days check warranty', 'Usman Butt Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (319, 126, '2025-09-27', 'Akhlaq Pixel 8 Black', '03189024490', FALSE, '7d5de697-5469-4e3c-b071-257d823911e2', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 87500, NULL, NULL, 'CPID; 3 days check warranty', 'Akhlaq Pixel 8 Black
3 days check warranty for
battery and software price
inclusive of charger process
and PTA tax
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (320, 125, '2025-09-26', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'buds pro 2', 'buds pro 2', 1, 35000, NULL, NULL, NULL, 'Hamza IT Tower G 15
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (321, 124, '2025-09-26', 'Faisal Venus Mobile G 05', '03237248321', FALSE, 'e25ea419-3a29-42ab-ba29-0b6177afa458', NULL, NULL, NULL, 0, 58000, NULL, NULL, NULL, 'Faisal Venus Mobile G 05', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (322, 123, '2025-09-25', 'Tasawar Hussain Pixel 8', '03061535240', FALSE, '4f168215-0559-407c-9625-d3bb9dc4538b', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 84000, NULL, NULL, 'CPID; 3 days check warranty', 'Tasawar Hussain Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (323, 122, '2025-09-25', 'Khubaib Idrees Pixel', '03334760579', FALSE, '868be4fe-52d4-4201-a2f4-cb07f8a166eb', 'Google', NULL, NULL, 0, 245500, NULL, '350712881338368', '3 days check warranty', 'Khubaib Idrees Pixel
350712881338368 3 days
check warranty for battery and
software 00421009848004
alfalah price inclusive of PTA
TAX', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (324, 121, '2025-09-25', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', NULL, 'cables', 'cables; chargers', 2, 3000, NULL, NULL, NULL, 'Zain 7a Buyer Iqbal Town
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (325, 120, '2025-09-25', 'Bilal Asghar Khan Lodhi', '03008412018', FALSE, 'd8df4a41-d9b7-4417-984b-3140da9b5a59', NULL, NULL, NULL, 0, 315000, NULL, NULL, NULL, 'Bilal Asghar Khan Lodhi', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (326, 119, '2025-09-23', 'Bilal Sb S 22ultra', NULL, TRUE, '99cdca60-793f-4371-8ac2-722b3c2a2a93', 'OnePlus', 'OnePlus 13t', 'OnePlus 13t', 1, 155000, NULL, NULL, NULL, 'Bilal Sb S 22ultra
OnePlus 13t 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (327, 118, '2025-09-25', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 78000, NULL, NULL, 'Non-PTA', 'Abyaan Saeed 123 Hafeez
Centre
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (328, 117, '2025-09-25', 'Adnan Qurashi G 7 Jazz', NULL, TRUE, '025a35d0-3db8-4e01-8be8-be3bba9a9b20', NULL, 'cables', 'cables; chargers', 2, 150000, NULL, NULL, 'Official; PTA Approved', 'Adnan Qurashi G 7 Jazz
official PTA approved
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (329, 116, '2025-09-22', 'Taimoor Hashim Pixel 8', '03200423292', FALSE, '16629de8-4386-4530-867b-320b9b77700e', 'Google', 'cables', 'cables; chargers', 2, 69000, '256GB', NULL, 'Official; 3 days check warranty', 'Taimoor Hashim Pixel 8
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (330, 115, '2025-09-22', 'Kinza Maier Pixel 7a', '03334121019', FALSE, 'da2e98cf-08ef-4af9-a7dd-ce5f2b4a057e', 'Google', 'pixel 7a', 'pixel 7a', 1, 49000, NULL, NULL, '3 days check warranty', 'Kinza Maier Pixel 7a
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (331, 114, '2025-09-22', 'Hamza 8 Pro White 256gb', '03121661371', FALSE, 'af3f0614-cbe7-4b42-bad1-a888d74c9066', NULL, 'cables', 'cables; chargers', 2, 130000, '256GB', NULL, '3 days check warranty', 'Hamza 8 Pro White 256gb
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (332, 113, '2025-09-22', 'Taqi Abass 9 Buyer White', '03455555794', FALSE, '075a340d-e5b8-41c5-8f22-34e8d3121c89', NULL, 'cables', 'cables; chargers', 2, 160000, NULL, NULL, 'Brand new/Box pack', 'Taqi Abass 9 Buyer White
payment via alfalah credit card
brand new non active
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (333, 112, '2025-09-21', 'Fahad Butt G 07', '03224011666', FALSE, '28d138a9-5124-4dc1-90f4-915eff14c71e', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 78000, NULL, NULL, 'Non-PTA; Received: 07
recieved', 'Fahad Butt G 07
recieved 20k
Pixel 7 pro non pta 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (334, 111, '2025-09-20', 'Ali Pixel 7 Lemon Official', '03014844840', FALSE, '84d73b2c-2889-4edc-bc6a-0a2b8cfa4928', 'Google', 'cables', 'cables; chargers', 2, 72000, '256GB', NULL, 'Official; 3 days check warranty', 'Ali Pixel 7 Lemon Official
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (335, 110, '2025-09-20', 'Iqbal Pixel 8 Pro', '03099936786', FALSE, 'f81d64f9-1606-49fb-93eb-72791c240de6', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 117000, NULL, NULL, '3 days check warranty', 'Iqbal Pixel 8 Pro
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (336, 108, '2025-09-19', 'Zaheer 7a Blue', '03248756360', FALSE, '5f102d2d-ffed-4469-b9cd-aebdc7461d34', NULL, 'cables', 'cables; chargers', 2, 50000, NULL, NULL, '3 days check warranty', 'Zaheer 7a Blue
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (337, 107, '2025-09-18', 'Rizwan 6a', '03057708279', FALSE, '59f7e5f0-988e-4575-8898-ca600f937229', 'Google', 'cables', 'cables; chargers', 2, 69000, '256GB', NULL, 'Official; 3 days check warranty', 'Rizwan 6a
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (338, 106, '2025-09-18', 'Haris Naveed Pixel 7a', '03009417469', FALSE, '40e46c91-aac3-4e6a-bee4-2a7bdeeef35a', 'Google', 'pixel 7a', 'pixel 7a', 1, 50000, NULL, NULL, '3 days check warranty', 'Haris Naveed Pixel 7a
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (339, 105, '2025-09-17', 'Imran Bhai Iphone 12', '03004170929', FALSE, '4b7bc862-06da-4534-86ba-4bb7ad4fff65', NULL, NULL, NULL, 0, 53000, NULL, NULL, '7 days check warranty', 'Imran Bhai Iphone 12
7 days check warranty for
battery and software
Ali Rana
Tower
✨   Sarwar G 15 IT', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (340, 109, '2025-09-21', '2 pieces pixel 8', NULL, TRUE, '7daeb430-f2bb-4bb1-9c18-686fb34f031e', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID x2', 2, 162000, NULL, NULL, 'CPID', '2 pieces pixel 8
Pixel 8 simple CPID 2 pcs', 'WARNING', 'Multi-qty (2 pcs) — per-unit price unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (341, 103, '2025-09-16', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, 'cables', 'cables; chargers', 2, 3000, NULL, NULL, NULL, 'Hanzala Iftikhar
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (342, 102, '2025-09-15', 'Jahanzeb Manjh', '03008426642', FALSE, '6373c8dd-3014-4770-968e-57f39575d7f8', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'CPID', 'Jahanzeb Manjh
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (343, 101, '2025-09-16', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', 'Google', 'pixel 6 pro', 'pixel 6 pro', 1, 66000, NULL, '860369039089998', NULL, 'Hanzala Iftikhar
pixel 6 pro 860369039089998', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (344, 100, '2025-09-15', 'Zeeshan Ali Cheema 6a Buyer', '03328887672', FALSE, '87a318d1-e0a0-4d54-91aa-d102357fcc14', 'Google', 'buds pro 1', 'buds pro 1', 1, 15000, NULL, NULL, NULL, 'Zeeshan Ali Cheema 6a Buyer
buds pro 1 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (345, 99, '2025-09-15', 'Uzair Yousaf Islamabad Pixel', '03123880666', FALSE, '08d8952f-b1ef-4e94-bc92-d65df077bcbc', 'Google', NULL, NULL, 0, 75000, NULL, NULL, '3 days check warranty', 'Uzair Yousaf Islamabad Pixel
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (346, 98, '2025-09-15', 'Awais 7 256gb Official', '03084721459', FALSE, 'd28fe1bc-8d71-4d80-8a7f-cff3e8e01c8d', NULL, NULL, NULL, 0, 71000, '256GB', NULL, 'Official; 3 days check warranty', 'Awais 7 256gb Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (347, 94, '2025-09-13', 'Abdullah Tariq Pixel 8 Black', '03218846206', FALSE, '5c1a320b-4836-419d-b0b7-be840f26e006', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 90000, NULL, NULL, 'CPID', 'Abdullah Tariq Pixel 8 Black
price inclusive of charger
cable tax etc etc
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (348, 93, '2025-09-13', 'Hafiz Bakhtiar Hussain Dps', '03004667234', FALSE, '86276416-1e8b-40e7-8d3b-c3b4c555741a', 'Google', 'cables', 'cables; chargers; cables; chargers x2', 5, 155000, '256GB', NULL, 'Official', 'cables 1 pcs
chargers 1 pcs
Hafiz Bakhtiar Hussain Dps
pixel 7 official 128gb/256gb 1
pcs
cables 1 pcs
chargers 2 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (349, 92, '2025-09-13', 'Farooq Khan 8 Pro', '03234338522', FALSE, '32cb3ae5-3630-423a-8ba4-4ecedd1cd892', NULL, NULL, NULL, 0, 48000, NULL, NULL, '3 days check warranty', 'Farooq Khan 8 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (350, 97, '2025-09-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta; cables; chargers', 3, 80000, NULL, NULL, 'Non-PTA; Remaining balance: 1k remaining', 'Hamza IT Tower G 15
1k remaining
Pixel 7 pro non pta 1 pcs
cables 1 pcs
chargers 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (351, 96, '2025-09-14', 'Hamza Pixel 6', '03134753205', FALSE, '4258aa94-0c42-43d3-948f-a4c6058bf983', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL; cables; chargers', 3, 215000, NULL, NULL, '3 days check warranty', 'Hamza Pixel 6
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (352, 95, '2025-09-14', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', NULL, NULL, NULL, 0, 71000, NULL, NULL, NULL, 'Ahmad 4a 5g Baghbanpura', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (353, 88, '2025-09-12', 'Saarim Pixel 8 Pro 256gb', '03047730808', FALSE, '2f4bee1a-ce66-49b3-bb7b-0246a1fa310a', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 128000, '256GB', NULL, '3 days check warranty', 'Saarim Pixel 8 Pro 256gb
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (354, 91, '2025-09-14', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID; cables x2; chargers x2', 5, 87500, NULL, NULL, 'CPID', 'Haris
Pixel 8 simple CPID 1 pcs
cables 2 pcs
chargers 2 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (355, 90, '2025-09-14', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', NULL, NULL, NULL, 0, 41500, NULL, NULL, NULL, 'Ali Rana
Tower
✨   Sarwar G 15 IT', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (356, 89, '2025-09-14', 'Qaisar Pixel 8 Pro', '03154339841', FALSE, '56c9a587-aed0-4da4-9d8a-105b2e2e3dee', 'Google', 'cables', 'cables; chargers', 2, 113000, NULL, NULL, '3 days check warranty', 'Qaisar Pixel 8 Pro
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (357, 87, '2025-09-11', 'Danish Pixel 8 Black', '03454273278', FALSE, '5fde9df5-cc1e-4d1c-8feb-b11181ed527c', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID; cables; chargers', 3, 85000, NULL, NULL, 'CPID; 3 days check warranty', 'Danish Pixel 8 Black
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (358, 86, '2025-09-11', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, 'cables', 'cables x2; chargers', 3, 3000, NULL, NULL, NULL, 'Hamza IT Tower G 15
cables 2 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (359, 85, '2025-09-10', 'Fahad Pixel 8 Pro Blue', '03203054788', FALSE, '0e4c54af-4ac8-434b-9e6e-25f782d645eb', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 110000, NULL, NULL, '3 days check warranty', 'Fahad Pixel 8 Pro Blue
3 days check warranty for
battery and software price
inclusive of PTA approval
charges', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (360, 84, '2025-09-09', 'Faizan Hassan Pixel 9', '03043610651', FALSE, '53a4f270-e46f-49dd-9e5c-668586ab7d29', 'Google', 'cables', 'cables; chargers', 2, 157000, NULL, NULL, '3 days check warranty', 'Faizan Hassan Pixel 9
3 days check warranty for
battery and software
cables 1 pcs
chargers 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (361, 83, '2025-09-08', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', NULL, NULL, NULL, 0, 105000, NULL, NULL, '3 days check warranty', 'Haris
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (362, 82, '2025-09-08', 'Syed Talha Shuja 6a', '03322319284', FALSE, 'e083010c-4a60-4514-8b98-238c9adb20a6', NULL, 'cables', 'cables; chargers', 2, 4500, NULL, NULL, NULL, 'Syed Talha Shuja 6a
Islamabad
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (363, 81, '2025-09-08', 'Muzammil 8 Pro Black', '03424388434', FALSE, '31ebb7ee-1258-4e7c-8d8d-a8b994d578ff', NULL, 'cables', 'cables; chargers', 2, 109000, NULL, NULL, '3 days check warranty', 'Muzammil 8 Pro Black
3 days check warranty for
battery and software price
inclusive of charger and cable
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (364, 80, '2025-09-05', 'Syed Talha Shuja 6a', '03322319284', FALSE, 'e083010c-4a60-4514-8b98-238c9adb20a6', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 145000, '128GB', NULL, 'Official; PTA Approved', 'Syed Talha Shuja 6a
Islamabad
official PTA approved price
inclusive of back cover back
sheet and front glass plus tcs
charges
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (365, 79, '2025-09-05', 'Farhan Pixel 7 Official 256gb', '03244002711', FALSE, '8019b445-edee-4cc7-8ffc-b038f0aecec9', 'Google', 'pixel 7', 'pixel 7', 1, 75000, '256GB', NULL, 'Official; 3 days check warranty', 'Farhan Pixel 7 Official 256gb
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (366, 78, '2025-09-04', 'Muhammad Ahmad 7a White', '03076548777', FALSE, '78ae5209-d618-46f8-959b-81daabf25aa9', NULL, 'cables', 'cables; chargers', 2, 2000, NULL, NULL, NULL, 'Muhammad Ahmad 7a White
cables 1 pcs
chargers 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (367, 77, '2025-09-04', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, NULL, NULL, 0, 70000, NULL, NULL, '3 days check warranty', 'Hanzala Iftikhar
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (368, 76, '2025-09-04', 'Muzaffar 6a Buyer Teacher', '03333666169', FALSE, 'f6bb23f8-2627-42d6-9f43-74743656f3d2', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 140000, '128GB', NULL, 'Official; 3 days check warranty', 'Muzaffar 6a Buyer Teacher
3 days check warranty for
battery and software
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (369, 75, '2025-09-04', 'Imran Pixel 9a Black', '03008129042', FALSE, '277c3e6d-c145-48ec-9043-8ae341152421', 'Google', NULL, NULL, 0, 136000, NULL, NULL, '3 days check warranty', 'Imran Pixel 9a Black
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (370, 74, '2025-09-04', 'Samran Pixel 7 Pro Black', '03074945859', FALSE, '0ce9bdde-bc67-4587-8ae4-426d402931cd', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 79000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Samran Pixel 7 Pro Black
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (371, 73, '2025-09-03', 'Haroon Sb Pixel 8 Pro Non Pta', '03008117480', FALSE, '45841845-70f9-40b1-b105-f732c2a6259a', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 107000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Haroon Sb Pixel 8 Pro Non Pta
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (372, 72, '2025-09-03', 'Ahmad Arshad 7a White', '03196548125', FALSE, 'cee1b880-bf78-4d08-bfb7-413dc22e6895', NULL, NULL, NULL, 0, 54000, NULL, NULL, '3 days check warranty', 'Ahmad Arshad 7a White
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (373, 71, '2025-09-03', 'Farzan Pixel 9a Iris Blue', '03255757658', FALSE, 'ed964337-e975-47dd-b507-f5e0b6b7df76', 'Google', NULL, NULL, 0, 134000, NULL, NULL, '3 days check warranty', 'Farzan Pixel 9a Iris Blue
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (374, 70, '2025-09-02', 'M Ali 7 Pro Hazel', '03054399235', FALSE, '6cf44bac-f0e6-4440-bd93-6b54a4dc34b2', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 75000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'M Ali 7 Pro Hazel
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (375, 69, '2025-09-02', NULL, NULL, FALSE, NULL, NULL, NULL, NULL, 0, 75000, NULL, NULL, '3 days check warranty', '3 days check warranty for
battery and software', 'WARNING', 'No product identified; No customer name');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (376, 68, '2025-09-02', 'Nadeem Akram Pixel Seller', '03006880105', FALSE, '726c60a7-80d2-46ad-b722-4d17ec198428', 'Google', 'buds pro 2', 'buds pro 2', 1, 34000, NULL, NULL, NULL, 'Nadeem Akram Pixel Seller
buds pro 2 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (377, 67, '2025-09-02', 'Bilal Shahnawaz Wapda', '03006575519', FALSE, '2e0a6a46-9be0-4506-a456-fefd1b361858', NULL, 'cables', 'cables', 1, 400, NULL, NULL, NULL, 'Bilal Shahnawaz Wapda
cables 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (378, 66, '2025-09-02', 'Raza Venus Mobile Peer Jee', '03007260834', FALSE, '7126b93a-9984-4cd8-9588-64028e317b01', NULL, NULL, NULL, 0, 215000, NULL, NULL, NULL, 'Raza Venus Mobile Peer Jee', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (379, 65, '2025-09-02', 'Fazal Abbas Noorka 4a 5g', '03008400069', FALSE, '96c88206-0bc6-4655-8a39-a32881660dbf', 'Google', 'noorka 4a', 'noorka 4a', 1, 175000, NULL, NULL, 'Exchange/Adjustment; Remaining balance: 50k remaining; Received: 105k recieved', 'Fazal Abbas Noorka 4a 5g
Buyer
price 175k 8 adjusted 70k
difference 105k recieved cash
50k remaining payable 55k', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (380, 64, '2025-09-01', 'Roman Tufail 6 Buyer', '03204000628', FALSE, 'f9d9b853-ab18-4c6b-a858-2f95cb4846d7', NULL, NULL, NULL, 0, 54000, NULL, NULL, '3 days check warranty', 'Roman Tufail 6 Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (381, 63, '2025-08-31', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', NULL, NULL, NULL, 0, 74000, NULL, '359099472387165, 359099472387173', '3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software
359099472387165
359099472387173', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (382, 62, '2025-08-29', 'Asif Ali 7 256gb Official', '03327004750', FALSE, 'c326c00c-720c-4c24-b88f-c69820147c74', NULL, NULL, NULL, 0, 72000, '256GB', NULL, 'Official; 3 days check warranty', 'Asif Ali 7 256gb Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (383, 61, '2025-08-29', 'Saad Pixel 7 Buyer', '03218877663', FALSE, '7f28ca87-3583-4ae3-8a6a-2966b4ec2032', 'Google', 'pixel 7', 'pixel 7', 1, 121000, NULL, NULL, '3 days check warranty', 'Saad Pixel 7 Buyer
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (384, 60, '2025-08-29', 'Ubaid 6a Official', '03032360096', FALSE, '4981b922-0ffc-4b6d-858a-ef63c8792a89', NULL, NULL, NULL, 0, 55000, NULL, NULL, 'Official; 3 days check warranty', 'Ubaid 6a Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (385, 59, '2025-08-29', 'Noman Ul Haq One Plus 13t', '03174330602', FALSE, 'd2744caf-4238-48fb-9d8d-aeb237f96b5d', 'OnePlus', 'OnePlus 13t', 'OnePlus 13t', 1, 150000, NULL, NULL, 'Brand new/Box pack', 'Noman Ul Haq One Plus 13t
brand new box pack
OnePlus 13t 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (386, 58, '2025-08-30', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, NULL, NULL, 0, 72000, NULL, NULL, NULL, 'Hanzala Iftikhar', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (387, 57, '2025-08-30', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', NULL, NULL, NULL, 0, 151500, NULL, NULL, NULL, 'Abyaan Saeed 123 Hafeez
Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (388, 56, '2025-08-30', 'Nazim Shehzad P 44 IT Tower', '03214722643', FALSE, '557ed2db-7c27-4c00-a323-639c2c7de842', NULL, NULL, NULL, 0, 41000, NULL, NULL, '3 days check warranty', 'Nazim Shehzad P 44 IT Tower
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (389, 53, '2025-08-28', 'Sheheryar Anwar 8 Pro', '03316460476', FALSE, '403fb934-83c7-4d96-b66c-9e3f5ccfd44a', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 91000, NULL, NULL, 'CPID', 'Sheheryar Anwar 8 Pro
price inclusive of PTA process
charger and cable
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (390, 52, '2025-08-27', 'Hassan Abbass S 21 Plus', '03265926515', FALSE, 'd1cf62ee-9859-4a2c-a393-7589b2e34a85', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 82000, NULL, NULL, 'CPID; 3 days check warranty', 'Hassan Abbass S 21 Plus
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (391, 51, '2025-08-26', 'Hassan Amin Care Of Bilal', '03244446888', FALSE, '73941d1a-64ba-41b0-a3bd-c2e8fe50941f', NULL, 'cables', 'cables', 1, 238500, NULL, NULL, '3 days check warranty', 'Hassan Amin Care Of Bilal
Lodhi
3 days check warranty for
battery and software
cables 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (392, 50, '2025-08-25', 'Nomi Bhai LG 10 Fazal Trade', '03216514274', FALSE, '5df92938-0408-4e06-9128-45d11b132a9d', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 202000, NULL, NULL, '3 days check warranty', 'Nomi Bhai LG 10 Fazal Trade
Centre
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (393, 49, '2025-08-25', 'Aashir Pixel 8 Black', '03236631605', FALSE, '6b4af8f7-8d4f-4dde-9f77-ab0a5dd77746', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'CPID; 3 days check warranty', 'Aashir Pixel 8 Black
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (394, 48, '2025-08-25', 'Mustafa Pixel 6a Green', '03390000412', FALSE, 'a2dfe43e-4c23-4013-bc62-0daf8f10d0fd', 'Google', 'cables', 'cables', 1, 50000, NULL, NULL, '3 days check warranty', 'Mustafa Pixel 6a Green
3 days check warranty for
battery and software
cables 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (395, 47, '2025-08-24', 'Faisal Butt G 1 Fazal Trade', '03236009000', FALSE, '8983a46c-8b19-439e-b644-a40b546f8636', NULL, NULL, NULL, 0, 160000, '256GB', NULL, 'Official; PTA Approved', 'Faisal Butt G 1 Fazal Trade
Centre
white official PTA approved
256gb', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (396, 46, '2025-08-24', 'Dr Shan 6a Buyer', NULL, TRUE, 'f2a04a00-90da-4afe-bb4f-bdc746fbb9a1', NULL, NULL, NULL, 0, 160000, '128GB', NULL, 'Official', 'Dr Shan 6a Buyer
blue 128gb official PTA
approved
Ali Rana
Tower
✨   Sarwar G 15 IT', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (397, 45, '2025-08-24', NULL, NULL, FALSE, NULL, NULL, NULL, NULL, 0, 95000, NULL, NULL, '3 days check warranty', '3 days check warranty for
battery and software', 'WARNING', 'No product identified; No customer name');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (398, 44, '2025-08-23', 'Abdullah Pixel 6a Non Pta', '03084233758', FALSE, 'd27a6e69-3186-45b9-aa92-d04302780f4b', 'Google', 'pixel 6a', 'pixel 6a', 1, 43000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Abdullah Pixel 6a Non Pta
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (399, 43, '2025-08-23', 'Shoaib Pixel 7 White', '03008115055', FALSE, '6b812e72-3b50-40fc-abda-6738fa3d06e3', 'Google', 'pixel 7', 'pixel 7', 1, 52000, NULL, NULL, '3 days check warranty', 'Shoaib Pixel 7 White
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (400, 42, '2025-08-22', 'Faisal 7 Pro', '03201443268', FALSE, '20bcd399-3ad3-4a0d-aef3-7c0c336ac058', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'CPID; 3 days check warranty', 'Faisal 7 Pro
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (401, 41, '2025-08-22', 'Mustajaab Shahid 7a', '03134059349', FALSE, '052ecef6-cf3b-47f2-89cc-188cd11e6862', NULL, NULL, NULL, 0, 51000, NULL, NULL, '3 days check warranty', 'Mustajaab Shahid 7a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (402, 40, '2025-08-22', 'Kamran Tahir 9A', '03362823938', FALSE, '9971b6b0-a08c-410d-89c1-46d49698a681', NULL, NULL, NULL, 0, 145000, NULL, NULL, 'Brand new/Box pack', 'Kamran Tahir 9A
brand new box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (403, 39, '2025-08-21', 'Hamza Gulzar Pixel 8', '03340017444', FALSE, '8ac902d2-ae97-4439-981d-0d1d476bdc73', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 82000, NULL, NULL, 'CPID; 3 days check warranty', 'Hamza Gulzar Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (404, 38, '2025-08-21', 'Ayan Khan 9 Pro XL Box Pack', '03060084475', FALSE, '3dc0a819-4f7b-42a8-a6de-10acf50b09a0', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 268000, NULL, NULL, 'Brand new/Box pack', 'Ayan Khan 9 Pro XL Box Pack
brand new sealed box pack
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (405, 37, '2025-08-20', 'Mazhar Iqbal 6 Pro 256gb', '03039075083', FALSE, '6be5b232-6898-4643-ae99-89339cf38d22', NULL, NULL, NULL, 0, 78000, '256GB', NULL, NULL, 'Mazhar Iqbal 6 Pro 256gb
with box 256gb white
approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (406, 36, '2025-08-20', 'Tipu Pixel 7 Official White', '03024018612', FALSE, '87ffe5d4-9df4-492f-86db-b07c9a112b80', 'Google', 'pixel 7', 'pixel 7', 1, 142000, '256GB', NULL, 'Official; 3 days check warranty', 'Tipu Pixel 7 Official White
3 days check warranty for
battery and software 1 charger
cable
pixel 7 official 128gb/256gb 2
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (407, 35, '2025-08-19', 'Taimoor Pixel 8 Pro', '03255333311', FALSE, 'c4ad5c6a-5e62-414b-9f13-afb171513188', 'Google', 'cables', 'cables', 1, 144500, NULL, NULL, '3 days check warranty', 'Taimoor Pixel 8 Pro
3 days check warranty for
battery and software
cables 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (408, 34, '2025-08-19', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', NULL, NULL, NULL, 0, 215000, NULL, NULL, 'Brand new/Box pack', 'Mudassir Kalpay
sealed box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (409, 33, '2025-08-16', 'Shahbaz 7 Official Black', '03284379889', FALSE, '515ebeb6-688d-4a4b-a8f8-5291bbe5c70f', 'Google', 'pixel 7', 'pixel 7', 1, 68000, '256GB', NULL, 'Official; 3 days check warranty', 'Shahbaz 7 Official Black
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (410, 32, '2025-08-16', 'Rafay Raza 7 Pro Buyer', '03164445330', FALSE, 'e3304fe2-2f1c-4a71-8d79-ac25d620ecc8', NULL, NULL, NULL, 0, 54000, NULL, NULL, '3 days check warranty', 'Rafay Raza 7 Pro Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (411, 31, '2025-08-16', 'Dr Ahmad Murad Pixel 8', '03344646101', FALSE, '430857a6-8a14-4c78-b75e-1ab1ba24ffb2', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 82000, NULL, NULL, 'Non-PTA; CPID', 'Dr Ahmad Murad Pixel 8
non PTA non active
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (412, 30, '2025-08-15', 'Zeeshan 7 Pro Hazel', '03234723927', FALSE, '97eb209c-186a-4511-b496-396c0c261bd7', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 77000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Zeeshan 7 Pro Hazel
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (413, 29, '2025-08-14', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', NULL, 'cables', 'cables', 1, 3000, NULL, NULL, NULL, 'Haris
cables 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (414, 28, '2025-08-14', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', 'pixel 7', 'pixel 7', 1, 75000, '256GB', NULL, 'Official', 'Haris
back cover charger cable
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (415, 27, '2025-08-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 140000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (416, 26, '2025-08-14', 'Faisal G 05 Venus Mobile', '03227474720', FALSE, '355cb734-3a4e-4fce-a877-009255c879b3', NULL, NULL, NULL, 0, 41500, NULL, NULL, NULL, 'Faisal G 05 Venus Mobile', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (417, 25, '2025-08-13', 'Saad Pixel 8 Hazel', '03164388112', FALSE, 'd2fb2501-e19e-4500-b785-147551b2f95d', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 82000, NULL, NULL, 'Brand new/Box pack; CPID; 3 days check warranty', 'Saad Pixel 8 Hazel
brand new 3 days check
warranty for battery and
software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (418, 24, '2025-08-13', 'Hafeez Pixel 8', '03458641000', FALSE, '01485b53-9c24-482f-bf42-aeeaf399bc93', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 86000, NULL, NULL, 'CPID; 3 days check warranty', 'Hafeez Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (419, 23, '2025-08-13', 'Jahanzeb 6 Pro Official', '03004880875', FALSE, '88db9797-9735-4276-950e-c4299b7dff2c', NULL, NULL, NULL, 0, 74250, NULL, NULL, 'Official; PTA Approved', 'Jahanzeb 6 Pro Official
official PTA approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (420, 22, '2025-08-13', 'Waqas Pixel 8 Pro', '03444222185', FALSE, 'fd664c1a-98e9-4725-98d2-e6490ca1c156', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 115000, '128GB', NULL, 'Official; 3 days check warranty', 'Waqas Pixel 8 Pro
3 days check warranty for
battery and software tax paid
pixel 8 pro 128gb official 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (421, 21, '2025-08-11', 'Mateen Pixel 7 Official Black', '03024161658', FALSE, 'b2751ef5-b0c8-4402-ba9e-437a26c044b4', 'Google', 'pixel 7', 'pixel 7', 1, 74000, '256GB', NULL, 'Official; 3 days check warranty', 'Mateen Pixel 7 Official Black
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (422, 20, '2025-08-11', 'M Areeb Pixel 7 Official', '03061293253', FALSE, '52f69550-105b-4fa1-8f6d-f02cb70ef3b6', 'Google', 'pixel 7', 'pixel 7', 1, 71000, '256GB', '359099477786049', 'Official; 3 days check warranty', 'M Areeb Pixel 7 Official
359099477786049 3 days
check warranty for battery for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (423, 19, '2025-08-10', 'Sarwar G 04 Fazal Centre', '03474048891', FALSE, '39636990-b423-4b4b-aa76-94d18dba302e', NULL, NULL, NULL, 0, 41000, NULL, NULL, NULL, 'Sarwar G 04 Fazal Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (424, 18, '2025-08-10', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, NULL, NULL, 0, 54000, NULL, NULL, '3 days check warranty', 'Hanzala Iftikhar
3 days check warranty for
battery and 6', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (425, 17, '2025-08-10', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 103000, '128GB', NULL, 'Official', 'Hamza IT Tower G 15
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (426, 16, '2025-08-09', 'Ahmad 4a 5g Baghbanpura', '03271749017', FALSE, 'adfa87f9-ce26-49ba-be46-38583c4cf501', NULL, NULL, NULL, 0, 75000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Ahmad 4a 5g Baghbanpura
3 days check warranty for
battery and software official
PTA approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (427, 15, '2025-08-09', 'Ahsan 9 Pro Black', '03215472989', FALSE, '23bd66d1-6a6c-421f-a410-a30e690a0955', NULL, NULL, NULL, 0, 225000, NULL, NULL, 'Brand new/Box pack', 'Ahsan 9 Pro Black
brand new box pack online
process done price inclusive
of accessories charger cable
front glass back cover', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (428, 14, '2025-08-08', 'Asad Abrar CM Office 8 Pro', '03334275334', FALSE, '50906cf4-c9db-4fee-b65c-16747f4bcafb', NULL, NULL, NULL, 0, 168000, NULL, NULL, '3 days check warranty', 'Asad Abrar CM Office 8 Pro
Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (429, 13, '2025-08-08', 'Saad Pixel 7 Official White', '03364031589', FALSE, '295d25f7-4537-44c1-a47e-904743e9e853', 'Google', 'pixel 7', 'pixel 7', 1, 70000, '256GB', NULL, 'Official; 3 days check warranty', 'Saad Pixel 7 Official White
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (430, 12, '2025-08-07', 'Faizan Sial G 20 Hassan Tower', '03158414041', FALSE, '4a37c834-b543-4ac8-a105-d21972afdf5f', 'Google', 'pixel 7', 'pixel 7', 1, 187500, '256GB', NULL, 'Official; PTA Approved', 'Faizan Sial G 20 Hassan Tower
official PTA approved
pixel 7 official 128gb/256gb 3
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (431, 11, '2025-08-07', 'Asad Pixel 8 Pro', '03481400801', FALSE, '2b00809c-307c-44fe-9f60-6f27b371b2aa', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 110000, '128GB', NULL, 'Official; 3 days check warranty', 'Asad Pixel 8 Pro
3 days check warranty for
battery and software
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (432, 10, '2025-08-07', 'Abdullah Sami S 23 Ultra', '03312512515', FALSE, 'cc2d7f9c-614c-4185-b597-c99eda95b559', 'Samsung', 's 23 ultra', 's 23 ultra', 1, 173000, NULL, NULL, '3 days check warranty', 'Abdullah Sami S 23 Ultra
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (433, 9, '2025-08-07', 'Talha Pixel 8', '03204747371', FALSE, '72cf8407-6987-4544-9c4b-6f369cc02d66', 'Google', 'pixel 8', 'pixel 8', 1, 54000, '256GB', NULL, 'Official; 3 days check warranty', 'Talha Pixel 8
3 days check warranty for
battery and software
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (434, 8, '2025-08-07', 'Abdullah Sajjad', '03334164452', FALSE, '7a8abaf3-0bd6-472b-a687-80ae5501d25f', NULL, NULL, NULL, 0, 42000, NULL, NULL, 'Has remaining balance', 'Abdullah Sajjad
recieved 40k balance 2k', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (435, 7, '2025-08-06', 'Ahmar 6 Pro', '03080301234', FALSE, '1bf7118c-b940-4b91-89b4-26553118ba24', NULL, NULL, NULL, 0, 73000, NULL, NULL, '3 days check warranty', 'Ahmar 6 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (436, 6, '2025-08-06', 'Talha Pixel 8', '03204747371', FALSE, '72cf8407-6987-4544-9c4b-6f369cc02d66', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'CPID', 'Talha Pixel 8
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (437, 5, '2025-08-06', 'Ahmad 8 Pro Official', '03344110603', FALSE, '358c3588-8239-4501-99fc-b53fcbad0a90', NULL, NULL, NULL, 0, 145000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Ahmad 8 Pro Official
official PTA approved 3 days
check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (438, 4, '2025-08-04', 'Muzaffar 6a Buyer Teacher', '03333666169', FALSE, 'f6bb23f8-2627-42d6-9f43-74743656f3d2', 'Google', 'pixel 6a', 'pixel 6a', 1, 143000, NULL, NULL, 'Exchange/Adjustment', 'Muzaffar 6a Buyer Teacher
pixel 6a adjusted in 30k', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (439, 3, '2025-08-08', 'Shahmeer 9a Iris', '03449398227', FALSE, '4dbdf02a-e4da-4f8b-a941-1d0f4c5ba74c', NULL, NULL, NULL, 0, 138000, NULL, '359657083321350', 'Brand new/Box pack', 'Shahmeer 9a Iris
brand new box pack
359657083321350', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (440, 2, '2025-08-04', 'Zahid Hussain S 24 Ultra', '03134757957', FALSE, '16eb5d0b-3b7f-4852-974c-92b03c6edd34', 'Samsung', 's 24 ultra', 's 24 ultra', 1, 169000, NULL, NULL, '3 days check warranty', 'Zahid Hussain S 24 Ultra
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (441, 1, '2025-08-04', 'Hadeed DHA 9 Pro XL', '03430411132', FALSE, '6e1dcc1c-6f0b-47de-bf1f-b9067bb12d5d', NULL, NULL, NULL, 0, 47500, NULL, NULL, '3 days check warranty', 'Hadeed DHA 9 Pro XL
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (442, 20, '2025-08-03', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 55000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (443, 19, '2025-08-10', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 78000, NULL, NULL, 'CPID', 'Adnan MZ Mobile
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (444, 18, '2025-08-03', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 87000, NULL, NULL, 'CPID', 'Haris
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (445, 17, '2025-08-03', '+1', NULL, TRUE, 'bf303de6-45d1-4a4a-b2cc-8ff9164f9d95', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 88000, NULL, NULL, 'CPID', '+1
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (446, 16, '2025-08-02', 'Dilshaad Ahmad 7 Pro Black', '03030596856', FALSE, 'f351688c-ca36-4418-9bb7-1165f4d83309', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 77000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Dilshaad Ahmad 7 Pro Black
3 days check warranty
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (447, 15, '2025-07-31', 'Sarwar G 04 Fazal Centre', '03474048891', FALSE, '39636990-b423-4b4b-aa76-94d18dba302e', NULL, NULL, NULL, 0, 122000, NULL, NULL, NULL, 'Sarwar G 04 Fazal Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (448, 14, '2025-07-31', 'Mohammed Ali 8 Pro Official', '03215557723', FALSE, '6b480491-03cd-4048-ada7-67e94300e626', NULL, NULL, NULL, 0, 215000, NULL, NULL, 'Official; Exchange/Adjustment; Has remaining balance', 'Mohammed Ali 8 Pro Official
8 pro adjusted in 140k
difference payable 75 amount
recieved 15k balance amount
60k', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (449, 13, '2025-07-30', 'Ali Chaudhary Pixel 7', '03244149411', FALSE, '8f079e7e-6134-474e-8633-ce926e338084', 'Google', 'pixel 7', 'pixel 7', 1, 58000, NULL, NULL, '3 days check warranty', 'Ali Chaudhary Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (450, 12, '2025-07-30', 'Naveed Salman Khan 9a', '03244452240', FALSE, '02e77c5c-c2b5-4042-8da1-ef5736f60b14', NULL, NULL, NULL, 0, 142000, NULL, NULL, 'Brand new/Box pack', 'Naveed Salman Khan 9a
brand new box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (451, 11, '2025-07-29', 'Rizwan Bhai MZ Mobile', '03218412345', FALSE, '5de01888-9741-4ab6-bbd2-0985178d96cd', NULL, NULL, NULL, 0, 98000, NULL, NULL, '3 days check warranty', 'Rizwan Bhai MZ Mobile
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (452, 10, '2025-07-29', 'Tanveer LG 7 Fazal Trade', '03007574456', FALSE, 'b232b45b-8d75-478c-9fc4-498d44d2800a', NULL, NULL, NULL, 0, 97500, NULL, NULL, '3 days check warranty', 'Tanveer LG 7 Fazal Trade
Centre
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (453, 9, '2025-07-29', 'Ahmad Pixel 9', NULL, TRUE, 'a809b8c6-4152-44a5-abfa-08db686bd366', 'Google', 'pixel 9', 'pixel 9', 1, 162000, NULL, NULL, '3 days check warranty', 'Ahmad Pixel 9
3 days check warranty for
battery and software price
inclusive of charger cable front
glass back cover', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (454, 8, '2025-07-28', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', 'Google', 'pixel 7', 'pixel 7', 1, 72000, '256GB', NULL, 'Official; PTA Approved', 'Basit Straight Way IT Tower
white official PTA approved
pixel 7 128gb
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (455, 7, '2025-07-28', 'Rangoli Jewellery Pixel 8', '03114111134', FALSE, '768a7bb0-c64f-44a9-9e82-5d3f47ea90df', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 86000, NULL, NULL, 'CPID', 'Rangoli Jewellery Pixel 8
price inclusive of charger
cable
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (456, 6, '2025-07-28', 'Omar Pixel 6a', '03104877835', FALSE, 'e58867f0-c704-43da-9e6c-cf651d1f245f', 'Google', 'pixel 6a', 'pixel 6a', 1, 65000, NULL, NULL, 'CPID; 3 days check warranty', 'Omar Pixel 6a
CPID process done 3 days
check warranty for battery and
software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (457, 5, '2025-07-28', 'Salman 6 Pro Official', '03047777655', FALSE, '34470a01-aca1-460c-baca-8e6152259d2a', NULL, NULL, NULL, 0, 80000, NULL, NULL, 'Official; 3 days check warranty', 'Salman 6 Pro Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (458, 4, '2025-07-26', 'Sheeraz Bhai 8 Pro With Buds', '03354400043', FALSE, '1c52acd2-4472-486a-a844-d26e7c39e330', NULL, NULL, NULL, 0, 146000, NULL, NULL, '3 days check warranty', 'Sheeraz Bhai 8 Pro With Buds
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (459, 3, '2025-07-25', 'Fazal Abbas Noorka 4a 5g', '03008400069', FALSE, '96c88206-0bc6-4655-8a39-a32881660dbf', 'Google', 'noorka 4a', 'noorka 4a', 1, 155000, NULL, NULL, 'Non-PTA; Has remaining balance; Received: 82000
recieved', 'Fazal Abbas Noorka 4a 5g
Buyer
non PTA non active 82000
recieved 73000 balance', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (460, 2, '2025-07-25', 'Omar Pixel 6a', '03104877835', FALSE, 'e58867f0-c704-43da-9e6c-cf651d1f245f', 'Google', 'pixel 6a', 'pixel 6a', 1, 43000, NULL, NULL, '3 days check warranty', 'Omar Pixel 6a
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (461, 1, '2025-07-25', 'Faizan Raja Mobile IT Tower', '03213617777', FALSE, '9a1b6f28-3e69-41e6-9ddb-ec4f443fea51', NULL, 'cables', 'cables', 1, 57000, NULL, NULL, 'CPID', 'Faizan Raja Mobile IT Tower
1000 for CPID expense extra
cables 1 pcs', 'WARNING', 'Brand unknown');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (462, 6, '2025-07-24', 'Kashif 9 Pro XL', '03224615526', FALSE, '17c44570-4209-4065-8a82-b95b5888fcef', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 220000, NULL, NULL, '3 days check warranty', 'Kashif 9 Pro XL
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (463, 5, '2025-07-24', 'Raja Rukhshan 8 Pro Buyer', '03468455345', FALSE, '2b5040a8-d193-47c4-b5b0-e630fff98d11', NULL, NULL, NULL, 0, 143000, NULL, NULL, 'Brand new/Box pack', 'Raja Rukhshan 8 Pro Buyer
brand new box pack 9a pink
colour price inclusive of
delivery charges', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (464, 4, '2025-07-24', 'Dr Shan 6a Buyer', NULL, TRUE, 'f2a04a00-90da-4afe-bb4f-bdc746fbb9a1', 'Google', 'pixel 9', 'pixel 9', 1, 165000, NULL, NULL, 'CPID', 'Dr Shan 6a Buyer
pixel 9 complete box obsedian
cpid done tax paid total cash
recieved dispatched to Dr sb', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (465, 3, '2025-07-23', 'Junaid Lakshmi Chowk', '03200423424', FALSE, 'c6afd9ec-8e60-4f17-8d99-0705a9fc68d8', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 82000, '128GB', NULL, 'CPID', 'Junaid Lakshmi Chowk
128gb non active rose quartz
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (466, 2, '2025-07-23', 'Waqar Sajjad 9 Pro XL', '03235515598', FALSE, '060c7685-74ec-41a8-b6b6-3003b19c49fd', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 215000, NULL, NULL, NULL, 'Waqar Sajjad 9 Pro XL
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (467, 1, '2025-07-22', 'Nazir Khan R 13', '03188687285', FALSE, '790f219d-0f3f-4209-aa2c-54c295669c3a', NULL, NULL, NULL, 0, 94000, NULL, NULL, '3 days check warranty', 'Nazir Khan R 13
3days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (468, 2, '2025-07-21', 'Ahmad Khudian Khaas Pixel 8', '03006530880', FALSE, '84d6ec2f-2abd-4cda-93bd-8d49733e379a', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 83000, NULL, NULL, 'CPID; 3 days check warranty', 'Ahmad Khudian Khaas Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (469, 1, '2025-07-19', 'Shahzaib 8 Pro Blue 128gb', '03234666618', FALSE, '4d40fd39-2e9f-4ed5-af27-0eaffe06b5bf', 'Google', 'pixel 8 pro 128gb official', 'pixel 8 pro 128gb official', 1, 116000, '128GB', NULL, 'Official; 3 days check warranty', 'Shahzaib 8 Pro Blue 128gb
3 days check warranty for
battery and software
pixel 8 pro 128gb official 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (470, 114, '2025-07-18', 'Sawal Pixel 6 Pro 256gb', '03262159077', FALSE, 'd6296369-a838-4aab-beff-1274f43e6d69', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 77000, '256GB', NULL, 'Non-PTA; 3 days check warranty; Has remaining balance; Received: 73k
recieved', 'Sawal Pixel 6 Pro 256gb
3 days check warranty for
battery and software 73k
recieved 4k balance payable in
7 days
Pixel 7 pro non pta 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (471, 112, '2025-07-17', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 315000, NULL, NULL, NULL, 'Hamza IT Tower G 15
all amount recieved', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (472, 111, '2025-07-17', 'Ihsan Aslam 9 Pro XL', '03074245042', FALSE, '50381fd4-e64a-4de6-9f12-a4b2ccd0a4b3', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 210000, NULL, NULL, NULL, 'Ihsan Aslam 9 Pro XL
price inclusive of pta duty 3
days check warrenty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (473, 104, '2025-07-18', 'Faisal 8 Pro 256gb', '03044980785', FALSE, '56db1ba1-d27a-4ae9-a8c4-cf6088d4c625', NULL, NULL, NULL, 0, 131000, '256GB', NULL, '3 days check warranty; Exchange/Adjustment', 'Faisal 8 Pro 256gb
3 days check warranty for
battery and software not
repaired or open price
inclusive of charger cable back
cover and glass blue colour
phone is exchanged with black
dual sim approved tax paid', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (474, 110, '2025-07-17', 'Fahad Pixel 8a Box Pack', '03215580877', FALSE, '19fb6856-91e8-4833-bb25-78d5803943a4', 'Google', 'pixel 8a', 'pixel 8a', 1, 98000, NULL, NULL, 'Brand new/Box pack', 'Fahad Pixel 8a Box Pack
box pack brand new', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (475, 109, '2025-07-17', 'Uzair Pixel 9 Faisalabad', '03057677279', FALSE, '2ff2e4e3-2775-42f6-9a65-0b0a0cb1c9f1', 'Google', 'pixel 9', 'pixel 9', 1, 175000, NULL, NULL, 'Brand new/Box pack', 'Uzair Pixel 9 Faisalabad
brand new', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (476, 113, '2025-07-18', 'Faizan Khalid 6a Buyer', '03170411910', FALSE, '8c4e6ef6-5788-4d64-ad35-8d47c650003d', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 90000, NULL, NULL, 'CPID', 'Faizan Khalid 6a Buyer
3k charged for CPID rose
quartz pixel 8
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (477, 107, '2025-07-16', 'Sheeraz S 22 Ultra 256gb', '03218807489', FALSE, 'b0b2a810-606a-4f55-afa2-fd02aeb657b1', 'Samsung', 's 22 ultra', 's 22 ultra', 1, 167000, '256GB', NULL, 'Official; 3 days check warranty', 'Sheeraz S 22 Ultra 256gb
Official
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (478, 106, '2025-07-18', 'Peer Jee', '03008430063', FALSE, '70e92cd9-f231-4bc0-ba5f-152623f95c4e', NULL, NULL, NULL, 0, 159000, NULL, NULL, '3 days check warranty', 'Peer Jee
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (479, 105, '2025-07-15', 'Abdullah Pixel 8 HAZEL', '03249889410', FALSE, 'cf6ae5df-002e-472a-8991-1bdd41cce5fc', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 84000, NULL, NULL, 'CPID; 3 days check warranty', 'Abdullah Pixel 8 HAZEL
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (480, 103, '2025-07-15', 'Mohammed Ahmed DPS', NULL, TRUE, '400b1742-dddf-4cf2-ba4e-5f207938c376', NULL, NULL, NULL, 0, 175000, NULL, NULL, 'Official; 3 days check warranty', 'Mohammed Ahmed DPS
35 006042 106444 5 35
006042 127823 5 official pta
approved 3 days check
warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (481, 102, '2025-07-15', 'Hamza Iqbal', '03354560466', FALSE, '629a9104-cc2b-4f49-a8b3-e6a447512396', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 75000, NULL, NULL, 'CPID', 'Hamza Iqbal
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (482, 101, '2025-07-15', 'Yaqoob Sb 8 Pro', '03214581974', FALSE, '8c9553dd-5328-4ed7-8198-c152b18afc8d', NULL, NULL, NULL, 0, 60000, NULL, NULL, '3 days check warranty', 'Yaqoob Sb 8 Pro
3 days check warranty for
battery and 6', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (483, 100, '2025-07-15', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'Brand new/Box pack; Non-PTA; CPID', 'Mudassir Kalpay
brand new non pta non active
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (484, 99, '2025-07-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 146000, NULL, NULL, 'Non-PTA', 'Hamza IT Tower G 15
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (485, 98, '2025-07-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 65000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (486, 97, '2025-07-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 81000, NULL, NULL, 'Non-PTA', 'Hamza IT Tower G 15
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (487, 96, '2025-07-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 75000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (488, 95, '2025-07-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 56000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (489, 94, '2025-07-14', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 108000, NULL, NULL, '3 days check warranty', 'Hamza IT Tower G 15
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (490, 93, '2025-07-14', 'Mohammed Ahmed DPS', NULL, TRUE, '400b1742-dddf-4cf2-ba4e-5f207938c376', NULL, NULL, NULL, 0, 175000, NULL, NULL, NULL, 'Mohammed Ahmed DPS', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (491, 92, '2025-07-14', 'Imran Ahmad 8 Pro Porcelain', '03004060109', FALSE, '01d034c5-a365-4fa1-94e1-c0e881130642', NULL, NULL, NULL, 0, 125000, '256GB', NULL, '3 days check warranty', 'Imran Ahmad 8 Pro Porcelain
256gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (492, 91, '2025-07-14', 'Taranjeet Singh S 24', '03339333449', FALSE, '039f6a2d-7758-423b-9101-ca9401f525a6', 'Samsung', 's 24', 's 24', 1, 155000, NULL, NULL, 'Official; PTA Approved', 'Taranjeet Singh S 24
official pta approved with box
only', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (493, 90, '2025-07-12', 'Kashif 7 Pro Official', '03228095216', FALSE, '7fa7f7a2-7574-4633-baeb-9a5ee0a70822', NULL, NULL, NULL, 0, 97000, NULL, NULL, 'Official; 3 days check warranty', 'Kashif 7 Pro Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (494, 89, '2025-07-12', 'Umair 7a Official', '03078890647', FALSE, 'd44a9279-70b8-4fa3-a769-700d2cd5c4e4', NULL, NULL, NULL, 0, 69000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Umair 7a Official
official pta approved 7a 11
battery cycles only 3 days
check warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (495, 88, '2025-07-11', 'Malik Abrar 9 Pro XL', '03249460050', FALSE, 'f3e7183a-78d6-41ed-9eba-aaf9c9b032db', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 255000, NULL, NULL, 'Brand new/Box pack', 'Malik Abrar 9 Pro XL
brand new box pack
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (496, 87, '2025-07-11', 'Ahmad Khan Pixel 8', '03116084411', FALSE, '1ae9c909-389d-41ba-82e8-8bd1c1e247d8', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 100000, NULL, NULL, 'Brand new/Box pack; CPID', 'Ahmad Khan Pixel 8
brand new box pack
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (497, 86, '2025-07-10', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 70000, NULL, NULL, '3 days check warranty', 'Hamza IT Tower G 15
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (498, 85, '2025-07-10', 'Atabick Pixel Buyer', '03204077095', FALSE, 'aa30168b-a2f1-49a0-a58e-9f6ef402a20a', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 87000, NULL, NULL, 'CPID', 'Atabick Pixel Buyer
phone ......82k charger cable
back cover front glass 5k
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (499, 84, '2025-07-10', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', NULL, NULL, NULL, 0, 46500, NULL, NULL, 'CPID', 'Haris
cable charger back cover front
glass 3500 phone without
CPID 43000', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (500, 83, '2025-07-09', 'Qadeer One Plus 13r', '03044724966', FALSE, 'ff757027-4bcb-4b22-919c-7be477b07f0a', NULL, NULL, NULL, 0, 99000, NULL, NULL, 'Brand new/Box pack', 'Qadeer One Plus 13r
brand new non active', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (501, 82, '2025-07-08', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 80000, NULL, NULL, 'Non-PTA', 'Abyaan Saeed 123 Hafeez
Centre
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (50, 81, '2025-07-08', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 79000, NULL, NULL, 'Non-PTA', 'Ali Rana
Tower
✨   Sarwar G 15 IT
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (2503, 80, '2025-07-08', 'Usama Pixel 8 Pro Sandha', '03204129950', FALSE, '07d9c31d-dba0-465a-a892-2b13788ccc03', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 153000, NULL, NULL, 'Brand new/Box pack', 'Usama Pixel 8 Pro Sandha
box pack', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (504, 79, '2025-07-08', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', NULL, NULL, NULL, 0, 147000, NULL, NULL, '3 days check warranty', 'Haris
3 days check warranty for
battery and software library', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (505, 78, '2025-07-08', 'Moeen Pixel 8 Pro Official', '03313300955', FALSE, 'fdb7184c-0dc1-49b6-aa4a-4ccd4a3ede1a', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 140000, NULL, NULL, 'Official; 3 days check warranty', 'Moeen Pixel 8 Pro Official
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (506, 77, '2025-07-08', 'Saad Malik Pixel 6 Tax Paid', '03324285156', FALSE, '47405f44-7524-45dd-af09-5e01507ea5b6', 'Google', 'pixel 6', 'pixel 6', 1, 52000, NULL, NULL, '3 days check warranty', 'Saad Malik Pixel 6 Tax Paid
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (507, 76, '2025-07-07', 'Ahmad Iqbal 8 Pro Non', '03164929960', FALSE, 'dcfc34d4-6dcb-487e-bfca-ef1abf81ffbe', NULL, NULL, NULL, 0, 126000, NULL, NULL, '7 days check warranty', 'Ahmad Iqbal 8 Pro Non
7 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (508, 75, '2025-07-05', 'Hassan Raja IT Tower Mobile', '03200401030', FALSE, '183e6848-b8a2-4835-a833-e79723f4db80', NULL, NULL, NULL, 0, 120000, NULL, NULL, NULL, 'Hassan Raja IT Tower Mobile', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (509, 74, '2025-07-05', 'Faizan Sial G 20 Hassan Tower', '03158414041', FALSE, '4a37c834-b543-4ac8-a105-d21972afdf5f', NULL, NULL, NULL, 0, 105000, NULL, NULL, NULL, 'Faizan Sial G 20 Hassan Tower', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (510, 73, '2025-07-04', 'Sayyam 6a Official', '03218400797', FALSE, 'de604b69-c99c-45f7-b659-011a0f30d15e', NULL, NULL, NULL, 0, 53000, NULL, NULL, 'Official; 3 days check warranty', 'Sayyam 6a Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (511, 72, '2025-07-04', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 79000, NULL, NULL, 'Non-PTA', 'Hamza IT Tower G 15
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (512, 71, '2025-07-05', 'Umair 8 Pro Official', '03034248676', FALSE, '02b3e370-5ed7-4a4d-aad4-92e99a99b0a8', NULL, NULL, NULL, 0, 232000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Umair 8 Pro Official
3 days check warranty for
battery and software both
sims official pta approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (513, 70, '2025-07-03', 'Faizan Sial G 20 Hassan Tower', '03158414041', FALSE, '4a37c834-b543-4ac8-a105-d21972afdf5f', NULL, NULL, NULL, 0, 52000, NULL, NULL, NULL, 'Faizan Sial G 20 Hassan Tower', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (514, 69, '2025-07-03', 'Atif Ranjha 7 Pro Buyer', '03224466222', FALSE, 'da0548ba-a0a7-4e22-810e-dac0ce95c2db', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 211000, NULL, NULL, NULL, 'Atif Ranjha 7 Pro Buyer
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (51, 68, '2025-07-03', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 80000, NULL, NULL, 'CPID', 'Ali Rana
Tower
✨   Sarwar G 15 IT
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (5516, 67, '2025-07-03', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 240000, NULL, NULL, 'Non-PTA', 'Abyaan Saeed 123 Hafeez
Centre
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (517, 66, '2025-07-03', 'Rehan Pixel 8 Black', '03018706285', FALSE, '40c37709-69c8-4223-a817-04da3953d38f', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 81000, NULL, NULL, 'CPID; 3 days check warranty', 'Rehan Pixel 8 Black
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (518, 65, '2025-07-02', 'Anees Khan Pixel 8', '03094161316', FALSE, '6acf4f91-a8a1-42cf-81f3-25022a4920dd', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'CPID; 3 days check warranty', 'Anees Khan Pixel 8
3 days check warranty for
battery and software price
inclusive of pta duty
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (519, 64, '2025-07-01', 'M Bilal Qadri 9 Pro XL', '03333542786', FALSE, '18affab7-ac49-4418-a78c-7dd5afc5d8f7', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 260000, NULL, NULL, NULL, 'M Bilal Qadri 9 Pro XL
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (520, 63, '2025-07-01', 'Ali Rana', NULL, TRUE, '9a48d70a-c414-46bc-8944-ceaeb980fe3b', NULL, NULL, NULL, 0, 21000, NULL, NULL, NULL, 'Ali Rana
Tower
✨   Sarwar G 15 IT', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (521, 62, '2025-07-01', 'Sarwar G 04 Fazal Centre', '03474048891', FALSE, '39636990-b423-4b4b-aa76-94d18dba302e', NULL, NULL, NULL, 0, 50000, NULL, NULL, NULL, 'Sarwar G 04 Fazal Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (522, 60, '2025-06-28', 'Abdullah LG 23 IT Tower AL', '03033597059', FALSE, '4c220b84-c727-4142-8805-cec376557b3b', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 245000, NULL, NULL, NULL, 'Abdullah LG 23 IT Tower AL
BURAK Traders & Technology
open box
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (523, 59, '2025-06-28', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 150000, NULL, NULL, '3 days check warranty', 'Hamza IT Tower G 15
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (524, 58, '2025-06-28', 'M Omar Pixel 8', '03028008257', FALSE, '397e653d-6bcf-4174-a5b1-4029958303fd', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 78000, NULL, NULL, 'CPID; 3 days check warranty', 'M Omar Pixel 8
3 days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (525, 57, '2025-06-28', 'Razi Butt 8 Pro Blue', '03120380006', FALSE, 'd0a9a397-9137-4e8b-a0b2-4b63d42b7047', NULL, NULL, NULL, 0, 108000, NULL, NULL, '3 days check warranty', 'Razi Butt 8 Pro Blue
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (526, 56, '2025-06-27', 'M Ali Pixel 9 Pro XL', '03481821188', FALSE, '5bbebafb-4300-43fa-aa7e-2288d13f82be', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 218000, NULL, NULL, '3 days check warranty', 'M Ali Pixel 9 Pro XL
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (527, 55, '2025-06-27', 'Dr Raza Elahi Orthopedic', '03226222274', FALSE, '2e61ed1a-12d8-47af-9ffe-022d50142d81', NULL, NULL, NULL, 0, 150000, NULL, NULL, '3 days check warranty', 'Dr Raza Elahi Orthopedic
Surgeon
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (528, 54, '2025-06-27', 'Aliyaan Pixel 7 Black', '03211180349', FALSE, '6de87165-1871-4489-94f0-df2ea2b9bab3', 'Google', 'pixel 7', 'pixel 7', 1, 68000, '256GB', NULL, 'Official', 'Aliyaan Pixel 7 Black
5k charged separately for
accessories charger back
cover front glass cable
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (529, 53, '2025-06-27', 'Abdullah Old Student 2018', '03083744004', FALSE, '2697223a-30ac-44b5-bf4e-ccbb99abee70', NULL, NULL, NULL, 0, 210000, NULL, NULL, NULL, 'Abdullah Old Student 2018', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (530, 52, '2025-06-27', 'Dr Habib Shaikh Zayed', '03034557127', FALSE, '25bf1def-ed7d-4943-8af3-feed125f079f', NULL, NULL, NULL, 0, 130000, NULL, NULL, NULL, 'Dr Habib Shaikh Zayed', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (531, 51, '2025-06-27', 'Hamza Raja Mobile', '03214289050', FALSE, '4c92ac3c-4c7d-47dd-bb17-46d7cbbb4bf2', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 232000, NULL, NULL, NULL, 'Hamza Raja Mobile
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (532, 50, '2025-06-27', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'pixel 6', 'pixel 6', 1, 54000, NULL, NULL, NULL, 'Hamza IT Tower G 15
pixel 6 charger cable included', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (533, 49, '2025-06-27', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 92000, NULL, NULL, 'CPID', 'Hamza IT Tower G 15
phone tax charger cable back
cover included
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (534, 48, '2025-06-26', 'Dilawar 6a White', '03099143709', FALSE, 'c95e4493-16ad-4743-bd9b-315b43df1549', NULL, NULL, NULL, 0, 41000, NULL, NULL, NULL, 'Dilawar 6a White
tax paid', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (535, 47, '2025-06-26', 'SAM Abuzar Naqvi Pixel 8', '03344398808', FALSE, '24eb7851-82cf-4911-b2d1-6f289221c9c3', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 85000, NULL, NULL, 'CPID; 4 days check warranty', 'SAM Abuzar Naqvi Pixel 8
4 days check warranty
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (536, 46, '2025-06-25', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', 'Google', 'pixel 7', 'pixel 7', 1, 85000, '256GB', NULL, 'Official', 'Basit Straight Way IT Tower
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (537, 45, '2025-06-24', 'Qasim Pixel 6 Buyer', '03094940433', FALSE, '20ffa011-9334-4a06-ae9f-680e51e3ef0e', 'Google', 'pixel 6', 'pixel 6', 1, 73000, NULL, NULL, NULL, 'Qasim Pixel 6 Buyer', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (538, 44, '2025-06-21', 'Ali Hassan Pixel 6 Pro', '03184607233', FALSE, '67c4bd77-7f43-4f17-9d8a-86c5df422ffe', 'Google', 'pixel 6 pro', 'pixel 6 pro', 1, 69000, NULL, NULL, '3 days check warranty', 'Ali Hassan Pixel 6 Pro
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (539, 43, '2025-06-21', 'Ali shahzad pixel 7 non pta', '0000111100', FALSE, '1e69d9c8-ade8-4054-9139-2204a7efeb16', 'Google', 'pixel 7', 'pixel 7', 1, 62000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Ali shahzad pixel 7 non pta
white
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (540, 42, '2025-06-21', 'Usama Asghar Shop 123', '03167901747', FALSE, 'dc974d69-4410-4386-9545-ec33c013a34b', NULL, NULL, NULL, 0, 50000, NULL, NULL, NULL, 'Usama Asghar Shop 123
Hafeez Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (541, 41, '2025-06-21', 'Haris 7 Pro Buyer', '03008405607', FALSE, 'c0134359-ff96-49f5-81fe-1749b1f576e7', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 165000, '128GB', NULL, '3 days check warranty', 'Haris 7 Pro Buyer
3 days check warranty for
battery and software payment
recieved online pixel 8 pro
128gb blue pixel 7 128gb
black', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (542, 40, '2025-06-19', 'Asad Straight Ways IT Tower', '03154277445', FALSE, '807825d5-b3ed-4192-be60-3a1fe4bf8a2b', NULL, NULL, NULL, 0, 96000, NULL, NULL, NULL, 'Asad Straight Ways IT Tower', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (543, 39, '2025-06-19', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 233000, NULL, NULL, NULL, 'Hamza IT Tower G 15
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (544, 38, '2025-06-19', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 140000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (545, 37, '2025-06-16', 'Shoaib Pixel 7 Lemon Grass', '03274733548', FALSE, '9d9abc04-15fb-46c9-a0e1-d5d880e41563', 'Google', 'pixel 7', 'pixel 7', 1, 55000, NULL, NULL, 'PTA Approved; 3 days check warranty', 'Shoaib Pixel 7 Lemon Grass
store
PTA approved 3 days check
warranty for battery and
software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (546, 36, '2025-06-15', 'Rafay Pixel', '03115360434', FALSE, 'ea412d0b-5eb3-4fef-b348-080831451306', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 145000, '128GB', NULL, 'Official; PTA Approved', 'Rafay Pixel
PIXEL 8 PRO 12GB 128GB
BLACK DUAL SIM OFFICIAL
PTA APPROVED CHARGER +
CABLE TCS CHARGES
INCLUDED', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (547, 35, '2025-06-15', 'Ammar Raza 9 Pro', '03004257983', FALSE, 'dfefb3e9-9cc9-4bf0-bb16-3e6b9b153ed1', NULL, NULL, NULL, 0, 192000, NULL, NULL, NULL, 'Ammar Raza 9 Pro
9 pro price. 192k charger cable
3k PTA tax 1.7k', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (548, 34, '2025-06-13', 'Qasim 6a Buyer', '03044909682', FALSE, 'ff0e8918-74ec-47d9-a9f2-472992b4e02a', 'Google', 'pixel 8', 'pixel 8', 1, 97000, '256GB', NULL, 'Official; Exchange/Adjustment', 'Qasim 6a Buyer
pixel 8 adjusted in 85k
difference payable 12k
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (549, 33, '2025-06-13', 'Farshyaan Tayyab G 10 IT', '03234365263', FALSE, '574cf206-d216-46ab-b66a-0b23bcd896ba', NULL, NULL, NULL, 0, 160000, NULL, NULL, '3 days check warranty', 'Farshyaan Tayyab G 10 IT
Tower
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (550, 32, '2025-06-12', 'Mudassir Masood 7 Official', '03044345645', FALSE, '06dcb50b-d9bb-4d97-85a7-95ef6eb3097a', 'Google', 'pixel 7', 'pixel 7', 1, 85000, '256GB', NULL, 'Official; PTA Approved', 'Mudassir Masood 7 Official
official pta approved
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (551, 31, '2025-06-12', 'Shahzaib 6a Muridke', '03140060191', FALSE, '639afff6-e248-4e32-8634-7cc2165e2830', NULL, NULL, NULL, 0, 41500, NULL, NULL, '3 days check warranty', 'Shahzaib 6a Muridke
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (552, 30, '2025-06-11', 'Mohammed Ahmad 9a', '03217070654', FALSE, '0e2670f9-0541-4723-9aee-3a3636bcc8c6', NULL, NULL, NULL, 0, 125000, NULL, NULL, '3 days check warranty', 'Mohammed Ahmad 9a
3 days check warranty for
battery and software UNDER
GOOGLE WARRANTY till April
2027', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (553, 29, '2025-06-11', 'Usman Rafique 8 Pro Official', '03004851320', FALSE, 'dc385c37-7612-4bea-91c2-33857d5590ec', NULL, NULL, NULL, 0, 138000, NULL, NULL, 'Official', 'Usman Rafique 8 Pro Official
3 days check warrenty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (554, 28, '2025-06-10', 'Zeeshan Ali Cheema 6a Buyer', '03328887672', FALSE, '87a318d1-e0a0-4d54-91aa-d102357fcc14', NULL, NULL, NULL, 0, 56000, NULL, NULL, '3 days check warranty', 'Zeeshan Ali Cheema 6a Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (555, 27, '2025-06-10', 'Daniyal 7a Buyer', '03004005055', FALSE, '6ead3027-c473-4812-b1fc-a3675c8d3ca8', NULL, NULL, NULL, 0, 56000, NULL, '359085096232648, 359085096233075', '3 days check warranty', 'Daniyal 7a Buyer
3 days check warranty for
battery and software
359085096232648
359085096233075', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (556, 26, '2025-06-06', 'Qasim Pixel 6 Buyer', '03094940433', FALSE, '20ffa011-9334-4a06-ae9f-680e51e3ef0e', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 92000, NULL, NULL, 'PTA Approved; CPID; 3 days check warranty', 'Qasim Pixel 6 Buyer
PTA approved tax paid front
glass back cover installed 3
days check warranty
Pixel 8 simple CPID 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (557, 25, '2025-06-05', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 67000, NULL, NULL, NULL, 'Hamza IT Tower G 15', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (558, 24, '2025-06-05', 'Mehboob 7a Box Pack', '03034142361', FALSE, '6bc144a5-697d-4869-b429-2911305d6175', NULL, NULL, NULL, 0, 82000, NULL, NULL, 'Brand new/Box pack', 'Mehboob 7a Box Pack
box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (559, 23, '2025-06-05', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 167000, NULL, NULL, 'Official; Non-PTA', 'Hamza IT Tower G 15
charger cable 3k 6 pro official.
79k 7 pro tax paid 85k
Pixel 7 pro non pta 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (560, 22, '2025-06-05', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', NULL, NULL, NULL, 0, 110000, NULL, NULL, 'Official; Exchange/Adjustment', 'Zain 7a Buyer Iqbal Town
8 pro ...................110k 6
official adjusted 50k buds
adjusted...... 15k cash recieved
......45k', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (561, 21, '2025-06-05', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 85000, NULL, NULL, 'Non-PTA', 'Abyaan Saeed 123 Hafeez
Centre
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (562, 19, '2025-06-05', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', NULL, NULL, NULL, 0, 79000, NULL, NULL, 'Official; PTA Approved', 'Basit Straight Way IT Tower
official pta approved black', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (563, 18, '2025-06-05', 'Zain 9 Pro 256gb', '03137717667', FALSE, '240638b6-130d-4f09-81be-221482c85870', NULL, NULL, NULL, 0, 234000, '256GB', NULL, NULL, 'Zain 9 Pro 256gb', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (564, 17, '2025-06-02', 'Syed Talha Shuja 6a', '03322319284', FALSE, 'e083010c-4a60-4514-8b98-238c9adb20a6', NULL, NULL, NULL, 0, 55000, NULL, NULL, NULL, 'Syed Talha Shuja 6a
Islamabad', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (565, 16, '2025-05-31', 'Dr Shan 6a Buyer', NULL, TRUE, 'f2a04a00-90da-4afe-bb4f-bdc746fbb9a1', NULL, NULL, NULL, 0, 140000, NULL, NULL, '3 days check warranty', 'Dr Shan 6a Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (566, 15, '2025-05-30', 'Hamza IT Tower G 15', NULL, TRUE, '05b9b9c6-dd07-45a1-9874-91d09affb590', NULL, NULL, NULL, 0, 165000, NULL, NULL, '3 days check warranty', 'Hamza IT Tower G 15
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (567, 14, '2025-05-29', 'Tahir Raza 6 Pro Official', NULL, TRUE, '457d33ec-9058-492a-bd0c-9b6b80d842d7', NULL, NULL, NULL, 0, 83000, NULL, NULL, 'Official; 3 days check warranty', 'Tahir Raza 6 Pro Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (568, 13, '2025-05-29', 'Dur E Adan Old Student 2020', '03214123767', FALSE, '15ae8ea8-73ba-4a0f-ba9e-ed379fcfbd34', NULL, NULL, NULL, 0, 185000, NULL, NULL, 'Brand new/Box pack; Official', 'Dur E Adan Old Student 2020
box pack under google official
warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (569, 12, '2025-05-29', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 85000, NULL, NULL, 'Non-PTA', 'Abyaan Saeed 123 Hafeez
Centre
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (570, 11, '2025-05-28', 'Hassan Raja IT Tower Mobile', '03200401030', FALSE, '183e6848-b8a2-4835-a833-e79723f4db80', 'Google', NULL, NULL, 0, 250000, NULL, NULL, 'Official; Exchange/Adjustment', 'Hassan Raja IT Tower Mobile
physical sim official pta
approved with box in
exchange of pixel
9a.....115000 net payable
........135000', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (571, 10, '2025-05-27', 'Haris Venus Mobile Apple', '03218343073', FALSE, '352fdcff-4e20-4731-b8c6-753d6e2734ac', NULL, NULL, NULL, 0, 51000, NULL, NULL, NULL, 'Haris Venus Mobile Apple', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (572, 9, '2025-05-27', 'Usama Pixel 6', '03067597201', FALSE, 'b64cf75a-88d9-4102-b79c-91bee83c9dea', 'Google', 'pixel 6', 'pixel 6', 1, 52000, NULL, NULL, '3 days check warranty', 'Usama Pixel 6
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (573, 8, '2025-05-27', 'Ahad Pixel 8 Pro 256gb', '03328853688', FALSE, '2715d6ed-01bd-4d1c-9657-8ec0b664451b', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 140000, '256GB', NULL, '3 days check warranty', 'Ahad Pixel 8 Pro 256gb
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (574, 6, '2025-05-27', 'Usman Pixel 7', '03218434406', FALSE, '8401f234-779b-4bdb-8a9f-1d61807753ea', 'Google', 'pixel 7', 'pixel 7', 1, 65000, NULL, NULL, '3 days check warranty', 'Usman Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (575, 5, '2025-05-27', 'Haji Sanaullah Muridke', '03009416742', FALSE, '5c682a92-c7e4-4e8a-abf0-e0db96eb793b', NULL, NULL, NULL, 0, 230000, NULL, NULL, NULL, 'Haji Sanaullah Muridke', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (576, 4, '2025-05-26', 'Taabish Pixel 7a', '03227860110', FALSE, '07e54ea7-7422-491c-a900-66b1c1951b45', 'Google', 'pixel 7a', 'pixel 7a', 1, 56000, NULL, NULL, NULL, 'Taabish Pixel 7a
3 days check for battery and
software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (577, 3, '2025-05-26', 'Ahsan Pixel 7 Official', '03045293108', FALSE, '328efe39-c053-4e05-8967-1c52b1787083', 'Google', 'pixel 7', 'pixel 7', 1, 64000, NULL, NULL, 'Official', 'Ahsan Pixel 7 Official', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (578, 2, '2025-05-24', 'Ibrar Sb 8 Pro', '03004246841', FALSE, 'a38d73f7-c3f9-41cc-9def-dbef06301216', NULL, NULL, NULL, 0, 110000, NULL, NULL, '3 days check warranty', 'Ibrar Sb 8 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (579, 1, '2025-05-24', 'Dr Talha 8 Pro Box Pack', '03318903381', FALSE, '07df43a5-d627-40f0-814e-f813bb02b569', NULL, NULL, NULL, 0, 125000, NULL, NULL, 'Brand new/Box pack', 'Dr Talha 8 Pro Box Pack
3 days check warrenty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (580, 3, '2025-05-22', 'Nabeel Endure 7 Official', '03236644138', FALSE, 'f31eb19c-dc36-4ed8-903b-7bc979774b56', 'Google', 'pixel 7', 'pixel 7', 1, 82000, '256GB', NULL, 'Official; PTA Approved', 'Nabeel Endure 7 Official
official pta approved
pixel 7 official 128gb/256gb 1
pcs', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (581, 2, '2025-05-21', 'Sana Fiaz 6a', '03104163654', FALSE, 'e5cbbc0c-950f-4fc8-b6d4-095cd067e6c5', NULL, NULL, NULL, 0, 42500, NULL, NULL, '3 days check warranty', 'Sana Fiaz 6a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (582, 1, '2025-05-20', 'Imran 6 Pro White', '03041128962', FALSE, 'af8bc765-75ae-4554-bc45-21a68829b83d', NULL, NULL, NULL, 0, 74000, NULL, NULL, '3 days check warranty', 'Imran 6 Pro White
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (583, 34, '2025-05-13', 'Zuhaib Pixel 6 Pro 256gb', NULL, TRUE, '2dcaba2a-237d-41ef-a293-dff79e18b87e', 'Google', 'pixel 6 pro', 'pixel 6 pro', 1, 72000, '256GB', NULL, '3 days check warranty', 'Zuhaib Pixel 6 Pro 256gb
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (584, 33, '2025-05-13', 'Hamza Pixel 6', '03134753205', FALSE, '4258aa94-0c42-43d3-948f-a4c6058bf983', 'Google', 'pixel 6', 'pixel 6', 1, 45000, NULL, NULL, '3 days check warranty', 'Hamza Pixel 6
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (585, 31, '2025-05-10', 'Dr Haris Omar 6a Buyer', '03004542992', FALSE, 'fda26489-8044-4a23-b472-fbc6d4fed90f', NULL, NULL, NULL, 0, 134000, NULL, NULL, '3 days check warranty', 'Dr Haris Omar 6a Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (586, 30, '2025-05-10', 'Sanwal 8 Pro', '03055217840', FALSE, 'a07b8df3-ceb6-4131-8f48-ae8a57cfb8f5', NULL, NULL, NULL, 0, 114000, '128GB', NULL, '3 days check warranty', 'Sanwal 8 Pro
8 pro 128gb physical sim tax
paid 3 days check warranty for
battery and software', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (587, 29, '2025-05-10', 'Usman Umar 7 Pro', '03274621914', FALSE, '536c995f-5dee-455b-8458-9e04977f90f8', NULL, NULL, NULL, 0, 86000, NULL, NULL, '3 days check warranty', 'Usman Umar 7 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (588, 28, '2025-05-09', 'Usman Bilal Sargodha', '03033147147', FALSE, 'eabee53e-7a48-44a1-9012-b32c4d174af7', NULL, NULL, NULL, 0, 85000, NULL, NULL, '3 days check warranty', 'Usman Bilal Sargodha
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (589, 27, '2025-05-09', 'Hammad 5a 5g Buyer', '03045268262', FALSE, '97b85224-5bad-4df5-8b52-83b2c6681d2e', NULL, NULL, NULL, 0, 188000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Hammad 5a 5g Buyer
non pta sim time over 3 days
check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (590, 26, '2025-05-08', 'Hammad Khalid Mirza DS', '03006346430', FALSE, 'c8c50cb0-c763-43e9-b24a-fc089cd5c458', NULL, NULL, NULL, 0, 390000, NULL, NULL, 'Brand new/Box pack', 'Hammad Khalid Mirza DS
Multan
brand new box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (591, 25, '2025-05-07', 'Arqam Pixel 7 Pro', '03317288790', FALSE, 'd82f2185-0d53-4937-b472-8871f7b5c372', 'Google', 'pixel 7 pro', 'pixel 7 pro', 1, 84000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Arqam Pixel 7 Pro
official pta approved 3 days
check warranty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (592, 24, '2025-05-07', 'Haris One Plus 7 Pro', '03214003406', FALSE, 'e270828b-7aee-4496-bf97-f49b9d585288', NULL, NULL, NULL, 0, 54000, NULL, '863420042394755', NULL, 'Haris One Plus 7 Pro
863420042394755 with
complete box', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (593, 23, '2025-05-05', 'Momin Sb 8a', '03235666632', FALSE, '9ddfb63b-dcd5-4cb5-a26f-da10a190e2ad', NULL, NULL, NULL, 0, 81000, NULL, NULL, '3 days check warranty', 'Momin Sb 8a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (594, 22, '2025-05-03', 'Farhan Pixel 7', '03154508608', FALSE, 'a6eccdfd-14d6-49df-9839-5dd315230ad4', 'Google', 'pixel 7', 'pixel 7', 1, 72500, NULL, NULL, NULL, 'Farhan Pixel 7', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (595, 21, '2025-05-03', 'Hammad 5a 5g Buyer', '03045268262', FALSE, '97b85224-5bad-4df5-8b52-83b2c6681d2e', NULL, NULL, NULL, 0, 71000, NULL, NULL, '3 days check warranty', 'Hammad 5a 5g Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (596, 20, '2025-05-03', 'Hamza 6a', '03466227290', FALSE, '401ad684-03d8-4c40-a9d3-b69c01ce1bab', NULL, NULL, NULL, 0, 49000, NULL, NULL, NULL, 'Hamza 6a
3 days check warrenty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (597, 19, '2025-05-02', 'Rehan 7 Pro', '03218847045', FALSE, '6df4d4f7-8fc3-4ac2-9a74-daabf2f12307', NULL, NULL, NULL, 0, 96000, NULL, NULL, '3 days check warranty', 'Rehan 7 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (598, 18, '2025-05-01', 'Abdullah Abbas Old Student', '03234426399', FALSE, '91275c99-5f05-4afc-8856-c9323af4b1ae', NULL, NULL, NULL, 0, 175000, NULL, NULL, '3 days check warranty', 'Abdullah Abbas Old Student
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (599, 17, '2025-04-30', 'Dilawar 6a White', '03099143709', FALSE, 'c95e4493-16ad-4743-bd9b-315b43df1549', NULL, NULL, NULL, 0, 88000, NULL, NULL, '3 days check warranty; Exchange/Adjustment', 'Dilawar 6a White
6a adjusted in 39k amount
payable 49k 3 days check
warranty for battery and
software', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (600, 16, '2025-04-30', 'Usama Pixel 7', '03254244804', FALSE, '7abcae5a-167e-497b-938a-ffba58bc485f', 'Google', 'pixel 7', 'pixel 7', 1, 66500, NULL, NULL, '3 days check warranty', 'Usama Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (601, 15, '2025-04-30', 'Ali Nazeer Pixel 9 Pro Xl', '03204155764', FALSE, '96b182a6-7e6a-47e0-8580-ec0a3c9d4e06', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 298000, NULL, NULL, 'Brand new/Box pack; PTA Approved', 'Ali Nazeer Pixel 9 Pro Xl
box pack online approved tax
paid
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (602, 13, '2025-04-30', 'Haseeb Pixel 7 Pro Hazel', '03084558699', FALSE, '6515e780-3ff9-4cf3-9c88-b66a3052add9', 'Google', 'pixel 7 pro', 'pixel 7 pro', 1, 82000, NULL, NULL, '3 days check warranty', 'Haseeb Pixel 7 Pro Hazel
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (603, 12, '2025-04-29', 'Saeed Pixel 8 Official', '03338888761', FALSE, 'ea5c143c-04b0-498f-8340-508a464a0718', 'Google', 'pixel 8', 'pixel 8', 1, 99000, NULL, NULL, 'Official; 3 days check warranty', 'Saeed Pixel 8 Official
single sim official pta
approved 3 days check
warranty for battery and
software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (604, 11, '2025-04-28', 'Haris', '03094159269', FALSE, 'd8fc974c-ba8d-4da4-976c-b1a8f1412722', 'Google', NULL, NULL, 0, 163700, '256GB', NULL, 'Official; PTA Approved', 'Haris
iphone 12 256gb official pta
approved pixel 4xl 64gb
official pta approved with
charger 2 cables 2 back
covers', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (605, 10, '2025-04-28', 'Shaikh Junaid S 23', '03214846880', FALSE, 'e7716964-a239-4b82-98f5-b68e07da4817', 'Samsung', 's 23', 's 23', 1, 106000, NULL, NULL, '3 days check warranty', 'Shaikh Junaid S 23
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (606, 9, '2025-04-28', 'Abdur Rehman Pixel 7', '03216444648', FALSE, 'ac7e64c4-b6c6-4b18-9c48-97fe57189e49', 'Google', 'pixel 7', 'pixel 7', 1, 63500, NULL, NULL, '3 days check warranty', 'Abdur Rehman Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (607, 8, '2025-04-26', 'HAIDER_BAWA_ khalifa', NULL, TRUE, '0bc4057d-aed3-4a8e-9045-ab079c52ea32', NULL, NULL, NULL, 0, 45000, NULL, NULL, '3 days check warranty', 'HAIDER_BAWA_ khalifa
3 days check warranty for
🥰❣️
battery and software physical
sim tax paid', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (608, 7, '2025-04-25', 'Nadeem Akram Pixel Seller', '03006880105', FALSE, '726c60a7-80d2-46ad-b722-4d17ec198428', 'Google', NULL, NULL, 0, 140000, NULL, '358951617588217', 'Official; PTA Approved', 'Nadeem Akram Pixel Seller
358951617588217 black 8 pro
official pta approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (609, 6, '2025-04-25', 'Hadeed DHA 9 Pro XL', '03430411132', FALSE, '6e1dcc1c-6f0b-47de-bf1f-b9067bb12d5d', NULL, NULL, NULL, 0, 176000, NULL, NULL, 'Brand new/Box pack; Non-PTA', 'Hadeed DHA 9 Pro XL
brand new box pack non pta
tax to be paid by the customer', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (610, 5, '2025-04-25', 'Furrukh Okara 8 Pro Buyer', '03360061177', FALSE, 'f238bcf6-eede-403d-96a4-1ad5d525a9a4', NULL, NULL, NULL, 0, 70000, '128GB', NULL, '3 days check warranty', 'Furrukh Okara 8 Pro Buyer
Lemon grass 128gb non active
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (611, 4, '2025-04-22', 'Safi Ullah Bhatti 8 Pro', '03214416412', FALSE, '5ab53ad3-ac72-4b89-806e-cbbc4ff2b535', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 177000, '256GB', NULL, 'Official; PTA Approved; 3 days check warranty', 'Safi Ullah Bhatti 8 Pro
Google pixel 8 pro 256gb dual
sim official pta approved 3
days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (612, 3, '2025-04-22', 'Yasir 6a Buyer', '03013112318', FALSE, '0b5cf739-9f00-493d-ada8-938c458cb905', NULL, NULL, NULL, 0, 43500, NULL, NULL, '3 days check warranty', 'Yasir 6a Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (613, 2, '2025-04-21', 'Ammar Pixel 6a', '03117065328', FALSE, 'e13d7e1c-c8a2-4200-a32b-3335c03883ef', 'Google', 'pixel 6a', 'pixel 6a', 1, 43500, NULL, NULL, '3 days check warranty', 'Ammar Pixel 6a
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (614, 1, '2025-04-20', 'Bilal Sb S 22ultra', NULL, TRUE, '99cdca60-793f-4371-8ac2-722b3c2a2a93', 'Samsung', 's 22ultra', 's 22ultra', 1, 297000, NULL, NULL, 'Brand new/Box pack', 'Bilal Sb S 22ultra
9 pro XL box pack with pta tax
...... 290000 original
charger...................................5
000 back
cover..........................................
.2000', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (615, 214, '2025-04-19', 'Abdur Rehman 7 Pro 256gb', '03244365178', FALSE, 'e52a65ef-9559-4474-87c5-45de042b0c2f', NULL, NULL, NULL, 0, 90000, '256GB', NULL, '3 days check warranty', 'Abdur Rehman 7 Pro 256gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (616, 213, '2025-04-19', 'Shaheer Pixel 7', '03095272972', FALSE, '4669f48a-120e-4ef8-961e-2b21cae2e016', 'Google', 'pixel 7', 'pixel 7', 1, 65500, NULL, NULL, '3 days check warranty', 'Shaheer Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (617, 211, '2025-04-17', 'Abdullah 6a', '03224572727', FALSE, '18d6a6b8-a484-4020-a862-74c382908daf', NULL, NULL, NULL, 0, 42000, NULL, NULL, '3 days check warranty', 'Abdullah 6a
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (618, 210, '2025-04-16', 'Saif Ullah PGC Head Office', NULL, TRUE, 'ca4b4ce8-a567-4ed6-87b0-f2b1216519cf', NULL, NULL, NULL, 0, 44000, NULL, NULL, '3 days check warranty', 'Saif Ullah PGC Head Office
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (619, 212, '2025-04-18', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 113000, '128GB', NULL, 'CPID', 'Zain 7a Buyer Iqbal Town
pixel 8 pro black 128gb CPID
2500 separately charged for
cable charger 3 days check
warrenty for battery and
software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (620, 9, '2025-04-12', 'Zaheer 7 Pro', '03164276884', FALSE, '633630e2-ee14-4613-b817-765cdad667f1', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 84000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Zaheer 7 Pro
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (621, 8, '2025-04-12', 'Zaryaab 7 Pro', '03204047411', FALSE, 'c106fc3b-651d-4fcc-bdd4-3d66acb42354', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 83000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Zaryaab 7 Pro
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (622, 7, '2025-04-12', 'Imad 8 Pro 256gb', NULL, TRUE, 'f9db98ab-9a39-4db6-92da-dbd7df17034f', NULL, NULL, NULL, 0, 126000, '256GB', NULL, '3 days check warranty', 'Imad 8 Pro 256gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (623, 6, '2025-04-11', 'Rameesha Pixel 7', '03104130704', FALSE, '70887d21-552d-4a2e-b09a-5b36f6e8ff8c', 'Google', 'pixel 7', 'pixel 7', 1, 65000, NULL, NULL, '3 days check warranty', 'Rameesha Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (624, 5, '2025-04-11', 'Aun Mohammed Pixel 7 Pro', '03176885987', FALSE, '434c14da-947e-40d0-b777-3042aa401ca1', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 83000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Aun Mohammed Pixel 7 Pro
3 days check warranty for
battery and software
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (625, 4, '2025-04-11', 'Dilawar 6a White', '03099143709', FALSE, 'c95e4493-16ad-4743-bd9b-315b43df1549', NULL, NULL, NULL, 0, 42000, NULL, NULL, '3 days check warranty', 'Dilawar 6a White
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (626, 3, '2025-04-11', 'Faisal 7 Pro', '03201443268', FALSE, '20bcd399-3ad3-4a0d-aef3-7c0c336ac058', 'Google', 'Pixel 7 pro non pta', 'Pixel 7 pro non pta', 1, 83000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Faisal 7 Pro
3 days check warranty
Pixel 7 pro non pta 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (627, 2, '2025-04-10', 'Ahmad 7 Lemon Grass', '03234069663', FALSE, 'a00fe504-b021-453a-b16f-229f77fbdb2a', NULL, NULL, NULL, 0, 64000, NULL, NULL, '3 days check warranty', 'Ahmad 7 Lemon Grass
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (628, 1, '2025-04-10', 'Sajid 8 Pro 256gb Blue', '03004821909', FALSE, 'a22c12ff-af22-4e32-9d70-00654a4bae1d', NULL, NULL, NULL, 0, 143500, '256GB', NULL, '3 days check warranty', 'Sajid 8 Pro 256gb Blue
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (629, 29, '2025-04-09', 'Fahad Saeed Dar 9 Pro', '03008428070', FALSE, '352460a4-03cd-4f18-a93e-5911391abcc7', NULL, NULL, NULL, 0, 230000, NULL, NULL, 'Brand new/Box pack; CPID', 'Fahad Saeed Dar 9 Pro
brand new box pack cpid', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (630, 28, '2025-04-09', 'Saud Pixel 8 Pro', '03259000203', FALSE, 'fac92fc2-41a0-46e3-9392-467a64bc2a5e', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 120000, NULL, NULL, '3 days check warranty', 'Saud Pixel 8 Pro
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (631, 27, '2025-04-05', 'Mehboob Ur Rasool 9 Pro', '03354702584', FALSE, 'b9633ab6-f8c1-4945-bcde-326f99d0e981', NULL, NULL, NULL, 0, 205000, NULL, NULL, NULL, 'Mehboob Ur Rasool 9 Pro', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (632, 26, '2025-04-04', 'Yasir 7 Pro Black', '03104490550', FALSE, '0f019a11-49ca-4e9d-9b8f-b3431a91e178', NULL, NULL, NULL, 0, 89000, NULL, NULL, '3 days check warranty', 'Yasir 7 Pro Black
price inclusive of charger
cable 3 days check warranty
for battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (633, 25, '2025-04-03', 'Salman 8 Pro 256gb', '03444530043', FALSE, '8425cd1f-281c-4082-ad0f-0d4655cdbb05', NULL, NULL, NULL, 0, 130500, '256GB', NULL, '3 days check warranty', 'Salman 8 Pro 256gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (634, 24, '2025-04-03', 'Sulmoon Pixel 6', '03114002218', FALSE, 'bdafb850-3a1a-4ca6-99d1-3426d8a8db9e', 'Google', 'pixel 6', 'pixel 6', 1, 60000, NULL, NULL, NULL, 'Sulmoon Pixel 6
cable charger phone 3 days
check warrenty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (635, 23, '2025-03-29', 'Naseem Sb 7 Official', '03039906848', FALSE, '86896790-e941-4890-bf15-c6bfeaaca237', NULL, NULL, NULL, 0, 100000, NULL, NULL, 'Official; PTA Approved', 'Naseem Sb 7 Official
official pta approved dual sim', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (636, 22, '2025-03-28', 'Ali Manager Honda Parts Pixel', '03028450560', FALSE, 'b607ca85-6781-432e-8f85-88b14365ff15', 'Google', 'pixel
6', 'pixel
6', 1, 60500, NULL, NULL, '3 days check warranty', 'Ali Manager Honda Parts Pixel
6
3 days check warranty for
battery and software phone
cost.....55000
accessories....5500', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (637, 21, '2025-03-26', 'Unais 7 Pro Dotted', '03008019559', FALSE, 'e0a9e2a3-5c7c-4add-adc3-6b8dff599668', NULL, NULL, NULL, 0, 71500, NULL, NULL, NULL, 'Unais 7 Pro Dotted
phone 67k charger cable 4k
back cover 0.5k total recieved
71500 rupees', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (638, 19, '2025-03-26', 'Awais 6a White', '03224722075', FALSE, '154526f2-908f-4d87-9d1c-fdfcb200ba20', NULL, NULL, NULL, 0, 42000, NULL, NULL, '5 days check warranty', 'Awais 6a White
5 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (639, 18, '2025-03-25', 'Saqib 6 Pro Official', '03134300381', FALSE, '980c9b1b-7c06-4a8c-b68a-e5713c7fac8d', NULL, NULL, NULL, 0, 80000, NULL, NULL, 'Official; 3 days check warranty', 'Saqib 6 Pro Official
3 days check warranty for
battery and software library', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (640, 17, '2025-03-25', 'Abdullah 9 Pro Xl', '03009449111', FALSE, '435d8ddc-453c-4ba5-9e84-ec572c0a34bc', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 522000, NULL, NULL, '3 days check warranty', 'Abdullah 9 Pro Xl
3 days check warranty for
battery and software
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (641, 16, '2025-03-24', 'Farhan Pixel 7', '03154508608', FALSE, 'a6eccdfd-14d6-49df-9839-5dd315230ad4', 'Google', 'pixel 7', 'pixel 7', 1, 62000, NULL, NULL, '3 days check warranty', 'Farhan Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (642, 15, '2025-03-21', 'Rizwan 6a', '03057708279', FALSE, '59f7e5f0-988e-4575-8898-ca600f937229', NULL, NULL, NULL, 0, 43000, NULL, NULL, '3 days check warranty', 'Rizwan 6a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (643, 14, '2025-03-20', 'Danish Afrooz 6a', '03400030002', FALSE, '5c1ad59d-000e-4e6f-b95a-d92d13bdec03', NULL, NULL, NULL, 0, 43000, NULL, NULL, '3 days check warranty', 'Danish Afrooz 6a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (644, 13, '2025-03-20', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', NULL, NULL, NULL, 0, 65000, NULL, NULL, NULL, 'Zain 7a Buyer Iqbal Town
3 days check warrenty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (645, 12, '2025-03-20', 'Moazziz 9 Pro XL', '03054668887', FALSE, '1e281b72-390f-40b2-9b36-eedcfad56a32', NULL, NULL, NULL, 0, 220000, NULL, NULL, '3 days check warranty', 'Moazziz 9 Pro XL
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (646, 11, '2025-03-19', 'Urwah G 27 IT Tower', '03111133050', FALSE, '7eb53f38-d946-466d-9809-7813097ac9d9', NULL, NULL, NULL, 0, 350000, NULL, NULL, 'Brand new/Box pack', 'Urwah G 27 IT Tower
AppleMac
brand new box pack non
active', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (647, 10, '2025-03-19', 'Furqaan Pixel 7', '03204495945', FALSE, 'e371dfbb-0aae-4f15-bfbc-995b0e1b236d', 'Google', 'pixel 7', 'pixel 7', 1, 65000, NULL, NULL, '3 days check warranty', 'Furqaan Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (648, 9, '2025-03-19', 'M Subhan 6 Pro', '03109295858', FALSE, '52b54cea-3372-4197-8c04-b27b48b26cae', NULL, NULL, NULL, 0, 74000, NULL, NULL, '3 days check warranty', 'M Subhan 6 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (649, 8, '2025-03-17', 'Fahad 6a White', '03042485554', FALSE, '818409ff-4640-4419-a48d-8b2a977e57be', NULL, NULL, NULL, 0, 43000, NULL, NULL, '3 days check warranty', 'Fahad 6a White
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (650, 7, '2025-03-14', 'Sohail Pixel 6', '03228636364', FALSE, 'b5bc8a46-b610-4170-bbb2-9ead8c70fda2', 'Google', 'pixel 6', 'pixel 6', 1, 113000, NULL, NULL, '3 days check warranty', 'Sohail Pixel 6
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (651, 6, '2025-03-14', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', NULL, NULL, NULL, 0, 213000, NULL, NULL, 'Brand new/Box pack', 'Mudassir Kalpay
BRAND NEW BOX PACK', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (652, 5, '2025-03-13', 'Razi G 122', '03234003420', FALSE, '41a4e0df-e280-47f1-8ce7-1c17cd7ef995', 'Google', 'pixel 9 pro', 'pixel 9 pro', 1, 225000, NULL, '350038900826302', 'Brand new/Box pack', 'Razi G 122
350038900826302 pixel 9 pro
black brand new box pack non
pta black', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (653, 4, '2025-03-13', 'Tanzeel Pixel 8 Pro', '03057252754', FALSE, 'bbec6609-b515-43cf-9659-7db3d103bbe1', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 130000, NULL, NULL, NULL, 'Tanzeel Pixel 8 Pro
3 days check warrenty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (654, 3, '2025-03-12', 'Tayyab Pixel 8 Pro', '03064741302', FALSE, '9c95e2cb-d742-4b17-87f3-0bf7d4ad0637', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 125000, NULL, NULL, '3 days check warranty', 'Tayyab Pixel 8 Pro
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (655, 2, '2025-03-12', 'Omar Khalid Pixel 9', '03105333289', FALSE, '3fc65f8f-7409-41b1-aa36-094033a3722d', 'Google', 'pixel 9', 'pixel 9', 1, 177000, NULL, NULL, 'Brand new/Box pack; CPID', 'Omar Khalid Pixel 9
brand new box pack cpid done', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (656, 1, '2025-03-12', 'Zeeshan Ali Cheema 6a Buyer', '03328887672', FALSE, '87a318d1-e0a0-4d54-91aa-d102357fcc14', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 98000, NULL, NULL, 'Brand new/Box pack; CPID; 3 days check warranty', 'Zeeshan Ali Cheema 6a Buyer
brand new under google
warranty till 7th July 2025 3
days check warranty for
battery and software
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (657, 9, '2025-03-10', 'Hanzala 7 Pro Hazel', '03063106533', FALSE, '7b0fd70d-8e77-4853-ab2b-9b085010425c', NULL, NULL, NULL, 0, 85000, NULL, NULL, NULL, 'Hanzala 7 Pro Hazel', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (658, 8, '2025-03-09', 'Jamil Raza G 57 Hafeez Center', '03214563708', FALSE, 'e9654916-657f-489f-a773-93b6921e4276', NULL, NULL, NULL, 0, 211000, NULL, NULL, 'Brand new/Box pack', 'Jamil Raza G 57 Hafeez Center
brand new box pack online
approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (659, 7, '2025-03-08', 'Waqas 6 Pro 256gb White', '03023563188', FALSE, 'f7da67a1-8382-4703-99e6-87232800ed29', NULL, NULL, NULL, 0, 87000, '256GB', NULL, '3 days check warranty', 'Waqas 6 Pro 256gb White
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (660, 6, '2025-03-08', 'Umar Malik S 23 Ultra', '03100071007', FALSE, '02a0621f-ae8a-4254-9d93-502100ace2de', 'Samsung', 's 23 ultra', 's 23 ultra', 1, 192000, NULL, NULL, '3 days check warranty', 'Umar Malik S 23 Ultra
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (661, 5, '2025-03-08', 'Hassaam Pixel 4xl Buyer', '03030842428', FALSE, 'f5230843-d81c-4a1a-8d2f-07ad16ea7f22', 'Google', NULL, NULL, 0, 135000, NULL, NULL, NULL, 'Hassaam Pixel 4xl Buyer', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (662, 4, '2025-03-07', 'Abdul Hadi 8 Pro', '03121436056', FALSE, '4aedbf0b-ddfd-456c-bee4-7139c17b6a06', NULL, NULL, NULL, 0, 136500, NULL, NULL, '3 days check warranty', 'Abdul Hadi 8 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (663, 3, '2025-03-07', 'Ruman Pixel 7', '03314484616', FALSE, '43798169-fb46-4fe7-8b0c-bf597edf72b8', 'Google', 'pixel 7', 'pixel 7', 1, 69000, NULL, NULL, '3 days check warranty', 'Ruman Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (664, 2, '2025-03-06', 'Ayaz S 23 128gb', '03224007533', FALSE, 'db251fca-d346-4738-90ed-92c3692995f4', 'Samsung', 's 23', 's 23', 1, 109000, '128GB', '352499091195329', '3 days check warranty', 'Ayaz S 23 128gb
3 days check warranty for
battery and software
352499091195329', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (665, 1, '2025-03-06', 'Zeeshan 6 Pro Official', '03224431969', FALSE, '6f5251a0-0c17-4195-bae7-fd96f60c0e16', NULL, NULL, NULL, 0, 85000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Zeeshan 6 Pro Official
official pta approved 3 days
check warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (666, 5, '2025-03-04', 'Imran Bhai G 05', '03004201164', FALSE, 'e3bb8a50-276c-4766-b784-01e92538272a', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 95000, NULL, NULL, 'CPID', 'Imran Bhai G 05
mint colour
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (667, 4, '2025-03-04', 'Abrar Jamil Pixel 9', '03223920187', FALSE, '8f7418a8-d40e-4be2-abcf-d767e42ba198', 'Google', 'pixel 9', 'pixel 9', 1, 172500, NULL, NULL, 'Brand new/Box pack', 'Abrar Jamil Pixel 9
BRAND NEW BOX PACK', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (668, 3, '2025-03-04', 'Hafiz Hamza 6a', '03446456088', FALSE, 'c331c8ca-1b67-4710-b93d-b80a6eba6cb9', NULL, NULL, NULL, 0, 46000, NULL, NULL, NULL, 'Hafiz Hamza 6a', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (669, 2, '2025-03-03', 'Dr Usama Pixel 7', '03364155144', FALSE, '67d545c2-d9ec-4d37-847d-61ebd7363896', 'Google', 'pixel 7', 'pixel 7', 1, 68000, NULL, NULL, '3 days check warranty', 'Dr Usama Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (670, 1, '2025-03-02', 'Bilal Pixel 7', '03208412622', FALSE, '1d3c11e0-52fe-4ed1-a672-bb009fcc6304', 'Google', 'pixel 7', 'pixel 7', 1, 65000, NULL, NULL, '3 days check warranty', 'Bilal Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (671, 209, '2025-03-01', 'Imran 6 pro 128gb', '03218881501', FALSE, '73abd700-e5ad-48fa-ac45-b74b4a2a871b', NULL, NULL, NULL, 0, 75000, '128GB', NULL, '3 days check warranty', 'Imran 6 pro 128gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (672, 208, '2025-02-27', 'Hamza 8 Pro Black C/O', '03044369925', FALSE, 'bcfa3333-59c9-47c5-b065-a8d090b7f606', NULL, NULL, NULL, 0, 125000, NULL, NULL, '3 days check warranty', 'Hamza 8 Pro Black C/O
Abdullah
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (673, 207, '2025-02-25', 'Junaid Lakshmi Chowk', '03200423424', FALSE, 'c6afd9ec-8e60-4f17-8d99-0705a9fc68d8', NULL, NULL, NULL, 0, 135000, '256GB', NULL, NULL, 'Junaid Lakshmi Chowk
3 days check warrenty black
256gb with cable', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (674, 206, '2025-02-25', 'Faisal Venus Mobile G 05', '03237248321', FALSE, 'e25ea419-3a29-42ab-ba29-0b6177afa458', NULL, NULL, NULL, 0, 134000, NULL, NULL, 'Has remaining balance', 'Faisal Venus Mobile G 05
balance 34000 only', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (675, 205, '2025-02-25', 'Faisal Venus Mobile G 05', '03237248321', FALSE, 'e25ea419-3a29-42ab-ba29-0b6177afa458', NULL, NULL, NULL, 0, 236000, NULL, NULL, NULL, 'Faisal Venus Mobile G 05', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (676, 204, '2025-02-22', 'Hassan Sajid 8 Pro Official', '03201400992', FALSE, 'd5be2a35-0c24-462c-a9b2-d0e56d8b435a', NULL, NULL, NULL, 0, 175000, NULL, NULL, 'Official; 3 days check warranty', 'Hassan Sajid 8 Pro Official
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (677, 203, '2025-02-22', 'Sara Shahid Pixel 9', '03209425537', FALSE, '3718e964-f188-4555-b0f0-9d13757334cc', 'Google', 'pixel 9', 'pixel 9', 1, 181000, NULL, NULL, 'Brand new/Box pack', 'Sara Shahid Pixel 9
bill inclusive of charger cable
front glass back cover ...phone
is brand new box pack', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (678, 202, '2025-02-22', 'Abdullah Ijaz 4xl Buyer', '03260405969', FALSE, '33a81d4a-0a6d-429d-9c1d-20abf86040c3', NULL, NULL, NULL, 0, 69000, NULL, NULL, '3 days check warranty', 'Abdullah Ijaz 4xl Buyer
3 days check warranty of
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (679, 201, '2025-02-21', 'Ahmad 9 Pro XL 256gb', '03140000004', FALSE, '8a628891-a6c8-4718-bf42-fb075f2fc210', NULL, NULL, NULL, 0, 278000, '256GB', NULL, 'Brand new/Box pack', 'Ahmad 9 Pro XL 256gb
BRAND NEW BOX PACK
UNDER GOOGLE WARRANTY', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (680, 200, '2025-02-19', 'Aneeq Markaz E Mustafa', '03486688469', FALSE, '6c4b998f-ee99-4ead-ad2b-e00f38037b90', NULL, NULL, NULL, 0, 145000, NULL, NULL, '3 days check warranty', 'Aneeq Markaz E Mustafa
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (68, 199, '2025-02-18', 'Abdul Majeed Skardu 8 Pro', NULL, TRUE, 'b9e64f2d-2da6-479f-a954-830db252b4c9', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'Abdul Majeed Skardu 8 Pro
3 days check warrenty for
🚩       76,000
battery and software', 'ERROR', 'Empty entry — no amount or product');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (1682, 198, '2025-02-17', 'Shehzad Khalil 8 Pro Official', '03008883299', FALSE, '7aaf985b-482b-4179-aa97-f2a885c94c97', NULL, NULL, NULL, 0, 168000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Shehzad Khalil 8 Pro Official
dual sim official pta approved
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (683, 197, '2025-02-15', 'Ahmad 6 Pro 256gb Buyer', '03019451024', FALSE, '7805875e-6e9f-49bb-99d0-560b3352c841', NULL, NULL, NULL, 0, 63000, '256GB', NULL, '3 days check warranty', 'Ahmad 6 Pro 256gb Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (684, 196, '2025-02-15', 'Usman 6 Pro', '03454142478', FALSE, '90686292-c826-4836-82de-c4244e2246ed', NULL, NULL, NULL, 0, 75000, NULL, NULL, '3 days check warranty', 'Usman 6 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (685, 195, '2025-02-13', 'Waqas 7a Buyer Wapda Town', '03094404021', FALSE, 'bfcac508-a60a-4e9a-a67b-5ac6777edc2e', NULL, NULL, NULL, 0, 89000, NULL, NULL, '3 days check warranty', 'Waqas 7a Buyer Wapda Town
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (686, 194, '2025-02-13', 'Mohammed Ali 8 Pro Official', '03215557723', FALSE, '6b480491-03cd-4048-ada7-67e94300e626', NULL, NULL, NULL, 0, 175000, NULL, NULL, 'Official; PTA Approved; 3 days check warranty', 'Mohammed Ali 8 Pro Official
official pta approved 3 days
check warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (687, 193, '2025-02-12', 'Raja Nosherwan London', '03349706032', FALSE, '59d4dbcf-b6d6-4e68-af0b-40c2fd9f25fe', NULL, NULL, NULL, 0, 146000, NULL, NULL, '3 days check warranty', 'Raja Nosherwan London
House Imported Electronic &
Crockery Store
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (688, 192, '2025-02-12', 'Furrukh Okara 8 Pro Buyer', '03360061177', FALSE, 'f238bcf6-eede-403d-96a4-1ad5d525a9a4', NULL, NULL, NULL, 0, 62000, NULL, NULL, '3 days check warranty', 'Furrukh Okara 8 Pro Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (689, 191, '2025-02-10', 'Abdul Raaziq 7 Pro 512gb', '03115458354', FALSE, '54f1e38e-2bb6-4bdb-9b89-c987413b94d6', NULL, NULL, NULL, 0, 111000, '512GB', NULL, '3 days check warranty', 'Abdul Raaziq 7 Pro 512gb
3 days check warranty for
battery and software price
inclusive of charger plus cable', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (690, 190, '2025-02-10', 'Hussain Pixel 6 256gb', '03074004379', FALSE, '6f4df8de-8ba2-4715-8081-5976c23aa896', 'Google', 'pixel 6', 'pixel 6', 1, 62500, '256GB', NULL, '3 days check warranty', 'Hussain Pixel 6 256gb
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (691, 189, '2025-02-10', 'Rana Awais 7 Pro 512gb', '03000823400', FALSE, '015c8733-cb3a-4b31-b8e6-2a7f9117b9ab', NULL, NULL, NULL, 0, 102000, '512GB', NULL, '3 days check warranty', 'Rana Awais 7 Pro 512gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (692, 187, '2025-02-08', 'Raja Nosherwan London', '03349706032', FALSE, '59d4dbcf-b6d6-4e68-af0b-40c2fd9f25fe', NULL, NULL, NULL, 0, 148000, '512GB', NULL, 'CPID; 7 days check warranty', 'Raja Nosherwan London
House Imported Electronic &
Crockery Store
CPID black colour like new
12gb 512gb 7 days check
warranty for battery and
software no warrenty for
shade dot dead touch pannel
mic and speakers', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (693, 186, '2025-02-08', 'Rizwan Bhai 9 PRO XL', '03454799196', FALSE, 'afcc1ada-29b3-4d24-a407-a828fe79c327', NULL, NULL, NULL, 0, 290000, NULL, NULL, 'Brand new/Box pack', 'Rizwan Bhai 9 PRO XL
BRAND NEW BOX PQCK', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (694, 185, '2025-02-08', 'Fahad Ghafoor 6a', '03200440619', FALSE, '9b996a1f-7627-4552-8930-0ef7c7f19ef7', NULL, NULL, NULL, 0, 46000, NULL, NULL, '3 days check warranty', 'Fahad Ghafoor 6a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (695, 184, '2025-02-08', 'Zohaib Pixel 6', '03416577700', FALSE, 'fded4cce-8e19-4a0d-a418-6d232854cbdb', 'Google', 'pixel 6', 'pixel 6', 1, 76000, NULL, NULL, '3 days check warranty', 'Zohaib Pixel 6
3 days check warranty for
battery and software for 6 pro', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (696, 188, '2025-02-09', 'Sarwar G 04 Fazal Centre', '03474048891', FALSE, '39636990-b423-4b4b-aa76-94d18dba302e', NULL, NULL, NULL, 0, 163000, NULL, NULL, 'Official; PTA Approved', 'Sarwar G 04 Fazal Centre
official pta approved dual sim', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (697, 180, '2025-02-06', 'Rehan Javaid 6 Pro', '03070147730', FALSE, '572f048b-3b89-49c5-857c-38a230863d28', NULL, NULL, NULL, 0, 84000, NULL, NULL, '3 days check warranty', 'Rehan Javaid 6 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (698, 179, '2025-02-06', 'Ali Umar 8 Pro Blue', '03014636267', FALSE, '842df1f2-9012-4846-b172-516a5a7dd00b', NULL, NULL, NULL, 0, 140000, NULL, NULL, '3 days check warranty', 'Ali Umar 8 Pro Blue
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (699, 183, '2025-02-07', 'Zain 7a Buyer Iqbal Town', '03094433314', FALSE, '9d125531-e360-40e4-8d00-aeaf3c5beb8a', NULL, NULL, NULL, 0, 99500, '256GB', NULL, 'Non-PTA', 'Zain 7a Buyer Iqbal Town
white 256gb non pta', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (700, 182, '2025-02-07', 'Zulfiqar Ali LG 20 Hafeez', '03225874449', FALSE, 'e8b384a5-9ad9-41d0-b129-1e5610de867e', NULL, NULL, NULL, 0, 248000, NULL, NULL, 'Brand new/Box pack', 'Zulfiqar Ali LG 20 Hafeez
Centre
brand new', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (701, 181, '2025-02-07', 'Hamza G 99 Mudassir', '03041245926', FALSE, '580a80b5-6cba-41b0-bb27-48a228c6817e', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 300000, NULL, NULL, NULL, 'Hamza G 99 Mudassir
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (702, 178, '2025-02-04', 'Qasim 6a Buyer', '03044909682', FALSE, 'ff0e8918-74ec-47d9-a9f2-472992b4e02a', NULL, NULL, NULL, 0, 77000, NULL, NULL, '3 days check warranty', 'Qasim 6a Buyer
3 days check warranty for
battery and warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (703, 177, '2025-02-04', 'Aleem 8 Pro Black', '03204067978', FALSE, 'c75e04a5-df22-47e1-8d2d-a0c62baf1e13', NULL, NULL, NULL, 0, 142000, NULL, NULL, '3 days check warranty', 'Aleem 8 Pro Black
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (704, 176, '2025-02-03', 'Shoaib Anjum Pixel Fold', '03227171135', FALSE, '76efaa00-5f90-436d-a225-3004c0293543', 'Google', NULL, NULL, 0, 163000, '256GB', NULL, 'Official; CPID; Exchange/Adjustment', 'Shoaib Anjum Pixel Fold
PORCELAIN 12GB 256GB
DUAL SIM OFFICIAL PTA
APPROVED SOLD IN
EXCHANGE WITH BLACK
256GB CPID PHONE WITH 35K
CASH', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (705, 175, '2025-02-03', 'Shoaib Anjum Pixel Fold', '03227171135', FALSE, '76efaa00-5f90-436d-a225-3004c0293543', 'Google', NULL, NULL, 0, 170000, '256GB', NULL, 'Official', 'Shoaib Anjum Pixel Fold
BLACK 256GB OFFICIAL PTA
APPROVED WILL BE
APPROVED WITHIN NEXT 10
DAYS MONEY BACK
GUARANTEE FOR PTA
APPROVAL', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (706, 174, '2025-02-01', 'Fahad Butt G 07', '03224011666', FALSE, '28d138a9-5124-4dc1-90f4-915eff14c71e', NULL, NULL, NULL, 0, 58000, NULL, NULL, NULL, 'Fahad Butt G 07
3 days check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (707, 173, '2025-02-01', 'Hikmat Yaar 6 Pro', '03339680536', FALSE, '7f62ec57-8eb0-4dd1-864d-3062e4125bee', NULL, NULL, NULL, 0, 75000, NULL, NULL, '3 days check warranty', 'Hikmat Yaar 6 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (708, 172, '2025-02-01', 'Haroon G 06', '03222524024', FALSE, 'fffcba59-c3e7-4ca8-8078-d182ea9c78f6', NULL, NULL, NULL, 0, 188000, NULL, NULL, 'Brand new/Box pack; Non-PTA; CPID', 'Haroon G 06
brand new box pack CPID
done non pta', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (709, 171, '2025-02-01', 'Zia Mustafa 7 Pro', '03066660668', FALSE, '9bf5f5bc-c45d-4cfc-9d07-02fd1da34732', NULL, NULL, NULL, 0, 90000, NULL, NULL, '3 days check warranty', 'Zia Mustafa 7 Pro
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (710, 170, '2025-02-01', 'Bilal Ahmad 6 Pro Official', '03414850547', FALSE, '4e9ae42f-d15e-443e-85ce-921e45ee4a4d', NULL, NULL, NULL, 0, 90000, NULL, NULL, 'Official; PTA Approved', 'Bilal Ahmad 6 Pro Official
dual sim official pta approved
tax will be paid within 7 to 10
days 100% money back
warranty', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (711, 169, '2025-01-31', 'Ali Raza 6a', '03006026651', FALSE, 'f1dafa1a-1456-4330-a636-21ebe07e910d', NULL, NULL, NULL, 0, 49000, NULL, NULL, '3 days check warranty', 'Ali Raza 6a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (712, 168, '2025-01-30', 'Ikram 9 PRO XL', '03349322828', FALSE, 'd661b8c5-48b8-4694-b7a2-301f9e8640bd', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 290000, NULL, NULL, 'Brand new/Box pack', 'Ikram 9 PRO XL
BRAND NEW BOX PACK ALL
BANKING APPS WILL WORK
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (713, 167, '2025-01-30', 'Mahmood 7 Pro Okara', '03047524590', FALSE, '5f1977ee-217e-46b4-bc04-abc65928a199', NULL, NULL, NULL, 0, 92000, NULL, NULL, '3 days check warranty', 'Mahmood 7 Pro Okara
3 days check warranty of
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (714, 166, '2025-01-30', 'Abdullah Abbas Old Student', '03234426399', FALSE, '91275c99-5f05-4afc-8856-c9323af4b1ae', NULL, NULL, NULL, 0, 108000, NULL, NULL, NULL, 'Abdullah Abbas Old Student', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (715, 165, '2025-01-29', 'Aqeel AhmadPixel 8 Pro', '03154643452', FALSE, '6a764b18-6c4f-4573-be8e-6f692b79b66b', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 135000, '256GB', '351486511113520, 351486511113538', '3 days check warranty', 'Aqeel AhmadPixel 8 Pro
blue 256gb 8 pro 3 days check
warranty 351486511113520
351486511113538', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (716, 164, '2025-01-28', 'Malik Mansha DSP', '03224555557', FALSE, 'fc2d5857-b2fd-45a1-8534-dba13c76c618', NULL, NULL, NULL, 0, 205000, NULL, NULL, NULL, 'Malik Mansha DSP', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (717, 163, '2025-01-28', 'Sajid Ali 8 Pro 512', '03066412222', FALSE, '4e0d262f-030b-4c68-8881-0c27da5a0d06', NULL, NULL, NULL, 0, 265000, NULL, NULL, 'Exchange/Adjustment', 'Sajid Ali 8 Pro 512
cash 135k 8 pro adjusted 130k', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (718, 162, '2025-01-27', 'Kaiii', '03338492892', FALSE, 'd2ad1842-2e96-4fbc-a52d-56193bf4ad59', NULL, NULL, NULL, 0, 250000, NULL, NULL, 'Brand new/Box pack', 'Kaiii
BRAND NEW BOX PACK', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (719, 161, '2025-01-27', 'Syed Sarim 8 Pro', '03244695045', FALSE, '64539505-2062-40b6-81d3-ad05feb7b5b6', NULL, NULL, NULL, 0, 137000, NULL, NULL, '3 days check warranty', 'Syed Sarim 8 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (720, 159, '2025-01-27', 'Faiq Ali 6 Pro', '03246630724', FALSE, '524ae332-3d9b-4437-8d8a-29ae69b18520', NULL, NULL, NULL, 0, 79000, NULL, NULL, '3 days check warranty', 'Faiq Ali 6 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (721, 158, '2025-01-25', 'Shafay Fahad Dar Pixel 9', '03214464488', FALSE, 'ce1f4c2b-f108-4c30-966b-17c7be994b90', 'Google', 'pixel 9', 'pixel 9', 1, 195000, NULL, NULL, 'Brand new/Box pack', 'Shafay Fahad Dar Pixel 9
BRAND NEW BOX PACK', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (722, 157, '2025-01-25', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', NULL, NULL, NULL, 0, 45000, NULL, NULL, NULL, 'Adnan MZ Mobile', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (723, 156, '2025-01-25', 'Usama Pixel 7', '03254244804', FALSE, '7abcae5a-167e-497b-938a-ffba58bc485f', 'Google', 'pixel 7', 'pixel 7', 1, 75500, NULL, NULL, '3 days check warranty', 'Usama Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (724, 155, '2025-01-25', 'Rana Gulzaib 6a', '03210210005', FALSE, 'cd5ffe37-c7d5-42f3-9164-fe254236c7ba', NULL, NULL, NULL, 0, 48500, NULL, NULL, '3 days check warranty', 'Rana Gulzaib 6a
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (725, 154, '2025-01-24', 'Ahmad Khalid Pixel 7 Pro', '03020423572', FALSE, '6cd01f7b-3bda-4d0a-999d-6725f11d1e64', 'Google', 'pixel 7 pro', 'pixel 7 pro', 1, 94000, NULL, NULL, '3 days check warranty', 'Ahmad Khalid Pixel 7 Pro
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (726, 153, '2025-01-24', 'Mubashir Pixel 5 Buyer', '03090014926', FALSE, '575a91a2-b0ec-418c-96b9-08dfb1b80d4c', 'Google', NULL, NULL, 0, 102000, NULL, NULL, '3 days check warranty', 'Mubashir Pixel 5 Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (727, 152, '2025-01-23', 'Qamar Sb 9 PRO XL', '03214499603', FALSE, '5ab7ccd5-b673-48bd-a9a5-19eb06ade2a4', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 250000, NULL, NULL, 'Brand new/Box pack', 'Qamar Sb 9 PRO XL
brand new box pack
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (728, 151, '2025-01-23', 'Afnan Liaqat 6 Pro 128gb', '03066276229', FALSE, '42cef933-e157-49e5-b6af-f4adfa16e8b4', NULL, NULL, NULL, 0, 77000, '128GB', NULL, '3 days check warranty', 'Afnan Liaqat 6 Pro 128gb
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (729, 150, '2025-01-22', 'Sajid Ali 8 Pro 512', '03066412222', FALSE, '4e0d262f-030b-4c68-8881-0c27da5a0d06', NULL, NULL, NULL, 0, 145000, NULL, NULL, '3 days check warranty', 'Sajid Ali 8 Pro 512
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (730, 149, '2025-01-21', 'Abdullah Gawadar 8 Pro', '03316646963', FALSE, '2968ecfe-0ecf-4f76-857f-17a2756afaae', NULL, NULL, NULL, 0, 155000, NULL, NULL, '3 days check warranty', 'Abdullah Gawadar 8 Pro
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (731, 148, '2025-01-21', 'Abdur Rehman Pixel 7a', '03010955508', FALSE, '09df7c49-b168-4237-8c0f-0a3a19410e95', 'Google', 'pixel 7a', 'pixel 7a', 1, 71000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Abdur Rehman Pixel 7a
3 days check warranty non pta', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (732, 147, '2025-01-21', 'Abuzar Bukhari', '03235554222', FALSE, '151e4a9c-c03e-4c01-a641-c43be0113e01', NULL, NULL, NULL, 0, 250000, NULL, NULL, 'Brand new/Box pack', 'Abuzar Bukhari
BRAND NEW BOX PACK', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (733, 146, '2025-01-21', 'Salman S23 Ultra Buyer', NULL, TRUE, '57c2d79e-f6f4-477b-a361-30c58bb719a8', 'Samsung', 's23 ultra', 's23 ultra', 1, 270000, NULL, '359657081647111, 359657081647228', 'Brand new/Box pack', 'Salman S23 Ultra Buyer
BRAND NEW BOX PACK
NATURAL TITANIUM DUAL
SIM PTA ONLINE IMEIs
359657081647111
359657081647228', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (734, 145, '2025-01-18', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', NULL, NULL, NULL, 0, 90000, NULL, NULL, 'Received: 45000 recieved', 'Adnan MZ Mobile
45000 recieved 45000 due', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (735, 144, '2025-01-18', 'Bilal Sb S 22ultra', NULL, TRUE, '99cdca60-793f-4371-8ac2-722b3c2a2a93', 'Samsung', 's 22ultra', 's 22ultra', 1, 162000, '256GB', NULL, 'CPID; Exchange/Adjustment', 'Bilal Sb S 22ultra
s22 256gb adjusted in 100k
50k credit card 12k cash CPID
is due towards Bilal sb CPID
fee payable 3500 rupees', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (736, 143, '2025-01-18', 'Imran Bhai G 05', '03004201164', FALSE, 'e3bb8a50-276c-4766-b784-01e92538272a', NULL, NULL, NULL, 0, 44000, NULL, NULL, '3 days check warranty', 'Imran Bhai G 05
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (737, 142, '2025-01-18', 'Javaid Naseer Pixel 7', '03114551006', FALSE, '143ceabc-ee58-4e06-9914-2dcae1db2fde', 'Google', 'pixel 7', 'pixel 7', 1, 76000, NULL, NULL, '3 days check warranty', 'Javaid Naseer Pixel 7
3 days check warranty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (738, 141, '2025-01-18', 'Zargham 8 Pro', '03234934385', FALSE, '2c1dfa61-cb0e-4d9e-aa94-9e0c06e386c5', NULL, NULL, NULL, 0, 139000, NULL, NULL, '3 days check warranty', 'Zargham 8 Pro
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (739, 140, '2025-01-17', 'Waqar Pixel 6 Pro White', '03356222022', FALSE, 'a485d3a0-70bc-4baa-a959-2b4d71e43086', 'Google', 'pixel 6 pro', 'pixel 6 pro', 1, 74000, NULL, NULL, NULL, 'Waqar Pixel 6 Pro White', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (740, 139, '2025-01-17', 'Nadeem 8 Pro 256gb', '03219449788', FALSE, 'ec58aa46-385f-44f1-90cd-da31ab4d984b', NULL, NULL, NULL, 0, 147000, '256GB', NULL, '3 days check warranty', 'Nadeem 8 Pro 256gb
3 days check warranty price
inclusive of accessories', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (741, 138, '2025-01-17', 'Uzair 8 Pro Buyer', '03222135222', FALSE, '8c007d40-f70f-4d1d-b097-568f53301c95', NULL, NULL, NULL, 0, 149000, NULL, NULL, NULL, 'Uzair 8 Pro Buyer', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (742, 137, '2025-01-17', 'Razi G 122', '03234003420', FALSE, '41a4e0df-e280-47f1-8ce7-1c17cd7ef995', NULL, NULL, NULL, 0, 254000, NULL, NULL, NULL, 'Razi G 122', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (743, 136, '2025-01-17', 'Illyas Park View Pixel Phone', '03114512735', FALSE, 'ada07a00-c590-48d0-a2fe-287866540371', 'Google', NULL, NULL, 0, 282000, NULL, NULL, 'Brand new/Box pack', 'Illyas Park View Pixel Phone
9 pro XL box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (744, 135, '2025-01-16', 'Usman Bonton Mobile 123', '03218888366', FALSE, '53a1ef52-935d-4110-bcbd-689cc4670d33', NULL, NULL, NULL, 0, 284000, NULL, NULL, NULL, 'Usman Bonton Mobile 123
Hafeez Centre', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (745, 134, '2025-01-16', 'Ashfaq Pixel 8 Pro', '03017678783', FALSE, 'ca9798d7-7b38-436d-b30f-de780ba3ee53', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 154000, NULL, NULL, NULL, 'Ashfaq Pixel 8 Pro
3 days check warrenty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (746, 133, '2025-01-15', 'Zain Ali 7 Pro', '03117794347', FALSE, 'd0c05d56-dac7-4371-8ecf-d608b939d8de', NULL, NULL, NULL, 0, 90000, NULL, NULL, '3 days check warranty', 'Zain Ali 7 Pro
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (747, 132, '2025-01-14', 'Hashaam 8 Pro', '03014498244', FALSE, 'd8459709-39f4-4cba-bff0-010931a13afe', NULL, NULL, NULL, 0, 140000, NULL, NULL, '3 days check warranty', 'Hashaam 8 Pro
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (748, 131, '2025-01-14', 'Hassan Pixel 8', '03124233181', FALSE, 'bc1f9331-54b7-4953-88cf-dbc4cede044c', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 123000, NULL, NULL, 'Brand new/Box pack; CPID', 'Hassan Pixel 8
box pack CPID
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (749, 130, '2025-01-14', 'Shahbaz Pixel 8 Pro', '03351714531', FALSE, '7e79c41c-66f3-48ae-b9f7-8d3fe897a537', 'Google', 'pixel 8 pro', 'pixel 8 pro', 1, 143000, NULL, NULL, '3 days check warranty', 'Shahbaz Pixel 8 Pro
3 days check warranty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (750, 129, '2025-01-13', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', NULL, NULL, NULL, 0, 140000, '256GB', NULL, NULL, 'Mudassir Kalpay
blue 256gb 12gb', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (751, 128, '2025-01-11', 'Muzammil 4a 5g', '03270160775', FALSE, '77fa884a-9967-462a-a377-931638e73779', NULL, NULL, NULL, 0, 135000, NULL, NULL, 'Brand new/Box pack', 'Muzammil 4a 5g
box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (752, 127, '2025-01-11', 'Abdul Qayyum Pixel 5', '03484868204', FALSE, '7f5d528f-9221-4294-82f1-1553c7316c64', 'Google', NULL, NULL, 0, 36500, NULL, NULL, NULL, 'Abdul Qayyum Pixel 5
3 days check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (753, 126, '2025-01-13', 'Abdullah Pixel 9 Pink', '03354352130', FALSE, '98c3cf91-3440-4ca5-b16f-d88ce9459eb2', 'Google', 'pixel 9', 'pixel 9', 1, 210000, NULL, NULL, 'Brand new/Box pack', 'Abdullah Pixel 9 Pink
brand new box pack', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (754, 125, '2025-01-11', 'Abdur Rehman Pixel 8a', '03244001068', FALSE, '42113384-c5b9-4300-8924-b07a09c2a24e', 'Google', 'pixel 8a', 'pixel 8a', 1, 107000, NULL, NULL, NULL, 'Abdur Rehman Pixel 8a', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (755, 124, '2025-01-11', 'Bilal Sb S 22ultra', NULL, TRUE, '99cdca60-793f-4371-8ac2-722b3c2a2a93', 'Google', 'pixel 7', 'pixel 7', 1, 105000, NULL, NULL, 'Exchange/Adjustment', 'Bilal Sb S 22ultra
charger OtterBox 5k pixel 7
back broken adjusted in 70k
amount payable 40k', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (756, 123, '2025-01-11', 'Haseeb S23 Ultra', '03007321959', FALSE, 'b0238b95-e9a2-4dd9-9548-4d3f6a064d53', 'Samsung', 's23 ultra', 's23 ultra', 1, 210000, NULL, NULL, NULL, 'Haseeb S23 Ultra
3 days check warrenty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (757, 122, '2025-01-10', 'Mujahid Pixel 8', '03176385894', FALSE, '8e608faa-9f10-44f2-93eb-77a7047940e2', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 107000, NULL, NULL, 'CPID', 'Mujahid Pixel 8
3 days check warrenty
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (758, 121, '2025-01-10', 'Zohaib Pixel 6', '03416577700', FALSE, 'fded4cce-8e19-4a0d-a418-6d232854cbdb', 'Google', 'pixel 6', 'pixel 6', 1, 60000, NULL, NULL, NULL, 'Zohaib Pixel 6
3 days check warrenty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (759, 120, '2025-01-12', 'Adnan MZ Mobile', '03227900900', FALSE, 'a1150df2-667e-4e22-864b-ce9585c5c738', NULL, NULL, NULL, 0, 270000, NULL, NULL, NULL, 'Adnan MZ Mobile', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (760, 119, '2025-01-08', 'Imran Chughtai Pixel 6', '03214888815', FALSE, '30ce5e43-8f59-46d8-b9db-b6c5924856c0', 'Google', 'pixel 6', 'pixel 6', 1, 60000, NULL, NULL, NULL, 'Imran Chughtai Pixel 6', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (761, 118, '2025-01-07', 'Farhan Nazim 6a Buyer', '03217657474', FALSE, '9ff8c1cb-1afe-49ee-a6b3-ab6efd956f37', NULL, NULL, NULL, 0, 131000, NULL, NULL, '3 days check warranty', 'Farhan Nazim 6a Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (762, 117, '2025-01-07', 'Umar Saqib 1 Byte 8 Pro', '03060123816', FALSE, 'cb334c5e-8603-4865-9e67-61df9ebeaef9', NULL, NULL, NULL, 0, 148000, NULL, NULL, '3 days check warranty', 'Umar Saqib 1 Byte 8 Pro
3 days check warranty of
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (763, 116, '2025-01-07', 'Aziz Ahmad Pixel 7', '03000501751', FALSE, '94344ba6-0cd4-4679-bb1c-f338e01769c4', 'Google', 'pixel 7', 'pixel 7', 1, 123000, NULL, NULL, '3 days check warranty', 'Aziz Ahmad Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (764, 113, '2025-01-06', 'Imran Bhai G 05', '03004201164', FALSE, 'e3bb8a50-276c-4766-b784-01e92538272a', NULL, NULL, NULL, 0, 106000, NULL, NULL, NULL, 'Imran Bhai G 05', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (765, 114, '2025-01-06', 'Naseer Ahmad Furniture 7 Pro', '03239031111', FALSE, 'ef451e19-f023-40eb-9c85-788c819c7730', NULL, NULL, NULL, 0, 103000, NULL, NULL, NULL, 'Naseer Ahmad Furniture 7 Pro', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (766, 112, '2025-01-06', 'Ahmad 8 Pro', '03330495384', FALSE, '8177aceb-0f5a-4d00-833a-f0471fdcaf4b', NULL, NULL, NULL, 0, 137500, NULL, NULL, '3 days check warranty', 'Ahmad 8 Pro
charger cable 2500 extra 3
days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (767, 111, '2025-01-04', 'Imran Bhai G 05', '03004201164', FALSE, 'e3bb8a50-276c-4766-b784-01e92538272a', NULL, NULL, NULL, 0, 57000, NULL, NULL, '3 days check warranty', 'Imran Bhai G 05
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (768, 110, '2025-01-04', 'Umar S24 Ultra', '03207385471', FALSE, '252cd119-db97-4632-8276-a90b8ae2ae08', 'Samsung', 's24 ultra', 's24 ultra', 1, 618000, NULL, NULL, NULL, 'Umar S24 Ultra
chargers two pair 10k back
cover fold 6 2500 back cover
s24 ultra 1000 total recieved
630000 rupees only', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (769, 109, '2025-01-02', 'Shehroz Al Rehman Garden', '03222234119', FALSE, '8011d179-2291-4908-b394-5e216a20fd5d', NULL, NULL, NULL, 0, 293000, NULL, NULL, 'Brand new/Box pack; CPID', 'Shehroz Al Rehman Garden
Phase 2 9 Pro XL
BRAND NEW BOX PACK CPID', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (770, 108, '2025-01-02', 'Fazal Abbas Noorka 4a 5g', '03008400069', FALSE, '96c88206-0bc6-4655-8a39-a32881660dbf', 'Google', 'pixel 6', 'pixel 6', 1, 75000, NULL, NULL, 'Exchange/Adjustment; Received: 30k recieved', 'Fazal Abbas Noorka 4a 5g
Buyer
pixel 6 adjusted in 45k online
30k recieved in HBL', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (771, 107, '2025-01-06', 'Ahmad Pixel 7', '03126272896', FALSE, '15148cb6-f3ae-4e1e-8c8e-cf8e860332f1', 'Google', 'pixel 7', 'pixel 7', 1, 85000, NULL, NULL, '3 days check warranty', 'Ahmad Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (772, 106, '2024-12-31', 'Bilal Pixel 7', '03208412622', FALSE, '1d3c11e0-52fe-4ed1-a672-bb009fcc6304', 'Google', 'pixel 7', 'pixel 7', 1, 79000, NULL, NULL, '3 days check warranty', 'Bilal Pixel 7
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (773, 105, '2024-12-30', 'Shahbaz Malik 8 Pro', '03215133993', FALSE, 'c2d40e42-1f7c-43e8-8090-9ae2605b763b', NULL, NULL, NULL, 0, 165000, NULL, NULL, NULL, 'Shahbaz Malik 8 Pro
3 days check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (774, 104, '2024-12-30', 'Hamza Saleem Old Student', '03334807802', FALSE, 'f966b0da-ba41-43d7-a9ea-6ddd2579ae6c', NULL, NULL, NULL, 0, 105000, NULL, NULL, NULL, 'Hamza Saleem Old Student
3 days check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (775, 103, '2025-01-01', 'Mustafa G 20 Hassan Tower', '03234391920', FALSE, '8df4b6fe-5847-45b2-b330-50d2dd83a1cf', NULL, NULL, NULL, 0, 56000, NULL, NULL, NULL, 'Mustafa G 20 Hassan Tower', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (776, 101, '2024-12-26', 'Tariq Mahmood DGK 9 Pro XL', '03006784200', FALSE, 'df01f4ce-d78f-4314-9684-3f76c3290bbb', NULL, NULL, NULL, 0, 295000, NULL, NULL, 'Brand new/Box pack', 'Tariq Mahmood DGK 9 Pro XL
Brand New box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (777, 99, '2024-12-26', 'Agha Haroon Sheikhpura 6', '03044790535', FALSE, '8ceb10f7-5686-407c-af5c-f218bdd77027', NULL, NULL, NULL, 0, 46000, NULL, NULL, '3 days check warranty', 'Agha Haroon Sheikhpura 6
Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (778, 98, '2024-12-26', 'Hassan Abbass S 21 Plus', '03265926515', FALSE, 'd1cf62ee-9859-4a2c-a393-7589b2e34a85', 'Samsung', 's 21 plus', 's 21 plus', 1, 82000, NULL, NULL, '3 days check warranty', 'Hassan Abbass S 21 Plus
3 days check warranty for
software and battery no
warrenty for shade dot camera
touch and dead', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (779, 97, '2024-12-24', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', NULL, NULL, NULL, 0, 60000, '128GB', NULL, 'CPID; 3 days check warranty', 'Mudassir Kalpay
DUAL CPID 8GB 128GB 3
DAYS CHECK WARRANTY FOR
BATTERY AND SOFTWARE', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (780, 94, '2024-12-23', 'Ahmed Jawad 7 Pro 512gb', '03047876961', FALSE, '98785a17-34a7-441b-94c9-6e1bdfe2608c', NULL, NULL, NULL, 0, 110000, '512GB', NULL, '3 days check warranty', 'Ahmed Jawad 7 Pro 512gb
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (781, 93, '2024-12-23', 'Ali Zaraar 6 Pro', NULL, TRUE, 'df19f22f-88b8-4c48-a03a-3456e1204084', NULL, NULL, NULL, 0, 78000, NULL, NULL, '3 days check warranty', 'Ali Zaraar 6 Pro
3 days check warranty for
software and battery', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (782, 96, '2024-12-24', 'Usman Bonton Mobile 123', '03218888366', FALSE, '53a1ef52-935d-4110-bcbd-689cc4670d33', NULL, NULL, NULL, 0, 285000, NULL, NULL, 'Brand new/Box pack', 'Usman Bonton Mobile 123
Hafeez Centre
brand new box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (783, 92, '2024-12-21', 'Ahmad G 114 Peer Jee', '03055147077', FALSE, 'c9e710be-7326-451d-8852-8cf7a76a8750', NULL, NULL, NULL, 0, 115000, NULL, NULL, '3 days check warranty', 'Ahmad G 114 Peer Jee
3 days check warranty for
battery and software only', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (784, 91, '2024-12-20', 'Taimoor 7a Buyer', '03454105452', FALSE, 'b68aa63e-ed2f-44b4-b30e-54058e7a68e9', NULL, NULL, NULL, 0, 76000, NULL, NULL, '3 days check warranty', 'Taimoor 7a Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (785, 90, '2024-12-20', 'Shaikh Zaheer 9 Pro XL', '03154058400', FALSE, '10465413-92f0-4b00-b1e1-4ba4c6591584', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 192500, '128GB', NULL, 'Brand new/Box pack; Exchange/Adjustment', 'Shaikh Zaheer 9 Pro XL
Brand New box pack 9 pro XL
128gb in exchange with pixel 7
pro 128gb
Pixel 9 pro XL 1 pcs', 'INFO', 'Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (786, 89, '2024-12-19', 'Aadil 8 Pro Blue', '03234167632', FALSE, 'db10ced8-7bea-4208-b8b8-8421c65b7f74', NULL, NULL, NULL, 0, 140000, NULL, NULL, '3 days check warranty', 'Aadil 8 Pro Blue
3 days check warranty for
software and battery', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (787, 88, '2024-12-19', 'Moaz Pixel 6', '03214834853', FALSE, '44cbaa55-7ee8-4c1f-8dd1-ddbab62343c3', 'Google', 'pixel 6', 'pixel 6', 1, 53000, NULL, NULL, '3 days check warranty', 'Moaz Pixel 6
3 days check warranty of
software and battery', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (788, 87, '2024-12-19', 'Waqas 7a Buyer Wapda Town', '03094404021', FALSE, 'bfcac508-a60a-4e9a-a67b-5ac6777edc2e', 'Samsung', 's 23', 's 23', 1, 55000, '128GB', NULL, '3 days check warranty; Exchange/Adjustment', 'Waqas 7a Buyer Wapda Town
3 days check warranty for
battery and software
exchange with s 23 8gb 128gb', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (789, 86, '2024-12-24', 'Mudassir Kalpay', '03154617638', FALSE, '6c066fa8-4256-4003-804d-eddc85ef1266', 'Google', 'Pixel 8 simple CPID', 'Pixel 8 simple CPID', 1, 116000, NULL, NULL, 'CPID; 3 days check warranty', 'Mudassir Kalpay
3 days check warranty black
CPID
Pixel 8 simple CPID 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (790, 85, '2024-12-19', 'Husnain 4xl Buyer Chuburji', '03184121412', FALSE, '10a751ec-f6fb-411a-936e-31ae1566407a', NULL, NULL, NULL, 0, 60000, NULL, NULL, 'Official; PTA Approved', 'Husnain 4xl Buyer Chuburji
dual sim official pta approved
white', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (791, 83, '2024-12-18', 'Abeel Butt 8 Pro Buyer', '03101015316', FALSE, '3ca40560-b207-44fb-bdca-e0a57970e33c', NULL, NULL, NULL, 0, 105000, NULL, NULL, '3 days check warranty', 'Abeel Butt 8 Pro Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (792, 82, '2024-12-18', 'Yaqoob Sb 8 Pro', '03214581974', FALSE, '8c9553dd-5328-4ed7-8198-c152b18afc8d', NULL, NULL, NULL, 0, 140000, NULL, NULL, '3 days check warranty', 'Yaqoob Sb 8 Pro
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (793, 84, '2024-12-19', 'Nabeel 6a Buyer', '03392281558', FALSE, 'fc812d9d-4e5b-4820-b788-c98a472d32d1', NULL, NULL, NULL, 0, 35000, NULL, NULL, 'Official; Exchange/Adjustment', 'Nabeel 6a Buyer
in exchange with 6a official
pta white adjusted in 45000', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (794, 81, '2024-12-17', 'Salman S23 Ultra Buyer', NULL, TRUE, '57c2d79e-f6f4-477b-a361-30c58bb719a8', 'Samsung', 's23 ultra', 's23 ultra', 1, 87000, NULL, NULL, '3 days check warranty', 'Salman S23 Ultra Buyer
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (795, 80, '2024-12-17', '8a Buyer', NULL, TRUE, '12183966-ec78-45b9-9fd0-9f40a811c337', NULL, NULL, NULL, 0, 106000, NULL, NULL, 'CPID; 3 days check warranty', '8a Buyer
CPID black 3 days check
warranty for software and
battery', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (796, 78, '2024-12-14', 'Rana Mujtaba 7 Pro', '03289036292', FALSE, 'ad7d5267-128b-4315-afc4-9e75a4999b1b', NULL, NULL, NULL, 0, 98000, NULL, NULL, '7 days check warranty', 'Rana Mujtaba 7 Pro
Gujranwala
7 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (797, 77, '2024-12-13', 'Ahmad Pixel 6', '03174147996', FALSE, 'f4da5f6e-0705-421b-a514-f3260a40b12c', 'Google', 'pixel 6', 'pixel 6', 1, 60000, NULL, NULL, NULL, 'Ahmad Pixel 6', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (798, 76, '2024-12-12', 'Farooq Khan 8 Pro', '03234338522', FALSE, '32cb3ae5-3630-423a-8ba4-4ecedd1cd892', NULL, NULL, NULL, 0, 155000, NULL, NULL, NULL, 'Farooq Khan 8 Pro
3 days check warrenty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (799, 75, '2024-12-12', 'Abdullah M Mobile G 13', NULL, TRUE, '59ffcc93-92ea-4020-bc34-7e0d0e3b0823', NULL, NULL, NULL, 0, 78000, NULL, NULL, NULL, 'Abdullah M Mobile G 13
Hassan Tower Opposite
Rizwan Bhai', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (80, 74, '2024-12-11', 'Abdul Majeed Skardu 8 Pro', NULL, TRUE, 'b9e64f2d-2da6-479f-a954-830db252b4c9', NULL, NULL, NULL, 0, NULL, '256GB', NULL, 'Brand new/Box pack; CPID', 'Abdul Majeed Skardu 8 Pro
brand new box pack white
🚩         93,000
256gb CPID', 'ERROR', 'Empty entry — no amount or product');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (801, 73, '2024-12-11', 'Illyas Park View Pixel Phone', '03114512735', FALSE, 'ada07a00-c590-48d0-a2fe-287866540371', 'Google', NULL, NULL, 0, 412000, NULL, NULL, NULL, 'Illyas Park View Pixel Phone
dispatched to HS mobile
mandi bahauddin tcs expense
1000 ...total 413000 only', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (802, 69, '2024-12-10', 'Tayyab Pixel 7 Pro 256gb', '03114136361', FALSE, 'f6945c4a-1a78-4f48-aea2-8765d70d6b43', 'Google', 'pixel 7 pro', 'pixel 7 pro', 1, 117500, '256GB', NULL, '3 days check warranty', 'Tayyab Pixel 7 Pro 256gb
3 days check warranty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (803, 68, '2024-12-10', 'Samraan Saqib Old Student', '03354346446', FALSE, '4b969a4a-2d1a-44c9-a8b1-c4d93b6c9cad', NULL, NULL, NULL, 0, 305000, NULL, NULL, 'Brand new/Box pack', 'Samraan Saqib Old Student
2012
Brand New box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (804, 71, '2024-12-25', 'Rauf Unique Mobile Hafeez', '03004136836', FALSE, '8abdb4a3-13c9-4dff-a387-ecd47007736e', 'Google', 'pixel 8', 'pixel 8', 1, 125000, '128GB', NULL, 'CPID', 'Rauf Unique Mobile Hafeez
Centre
3 days check warrenty pixel 8
rose colour 128gb CPID', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (805, 70, '2024-12-11', 'Syed Haider Naqvi 6 Pro', '03088863874', FALSE, 'a36fe508-f435-4d5c-80bf-e537a3da71ad', NULL, NULL, NULL, 0, 53000, NULL, NULL, 'Non-PTA; 3 days check warranty', 'Syed Haider Naqvi 6 Pro
Mianwali
non pta sim time over 3 days
check warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (806, 67, '2024-12-09', 'Usman Bonton Mobile 123', '03218888366', FALSE, '53a1ef52-935d-4110-bcbd-689cc4670d33', NULL, NULL, NULL, 0, 285000, NULL, NULL, 'Brand new/Box pack; CPID', 'Usman Bonton Mobile 123
Hafeez Centre
brand new box pack cpid', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (807, 66, '2024-12-08', 'Asad Abrar CM Office 8 Pro', '03334275334', FALSE, '50906cf4-c9db-4fee-b65c-16747f4bcafb', NULL, NULL, NULL, 0, 303000, NULL, NULL, 'Brand new/Box pack', 'Asad Abrar CM Office 8 Pro
Buyer
brand new box pack with back
cover', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (808, 65, '2024-12-07', 'Ch Ahmad Raza 9 Pro XL', NULL, TRUE, 'fcdaab62-c8e8-4888-857d-b615e28b8ec4', NULL, NULL, NULL, 0, 265000, '256GB', NULL, 'Brand new/Box pack', 'Ch Ahmad Raza 9 Pro XL
256gb
box pack brand new', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (809, 64, '2024-12-07', 'Abdur Rehman 8 Buyer', '03244955774', FALSE, '94a59354-f6bf-44b9-b532-39046265e572', NULL, NULL, NULL, 0, 125000, NULL, NULL, '3 days check warranty', 'Abdur Rehman 8 Buyer
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (810, 63, '2024-12-07', 'sundas waseem Iphone 14 Pro', '03134951492', FALSE, 'bec5ba68-6477-4b26-bf04-d120343552f2', NULL, NULL, NULL, 0, 138000, NULL, NULL, '3 days check warranty', 'sundas waseem Iphone 14 Pro
Max
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (811, 62, '2024-12-06', 'M Sheheryaar 9 Pro Xl', '03157177587', FALSE, 'd3a9a791-308c-4a9c-b5fe-a8317e8b4fc9', 'Google', 'Pixel 9 pro XL', 'Pixel 9 pro XL', 1, 276000, NULL, NULL, 'Brand new/Box pack', 'M Sheheryaar 9 Pro Xl
brand new box pack price
inclusive of accessories
Pixel 9 pro XL 1 pcs', 'OK', NULL);
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (812, 61, '2024-12-06', 'Usman 6 Pro Box Pack', '03134119829', FALSE, 'e5c3ac21-3f40-469d-9a7b-26bbd713436b', NULL, NULL, NULL, 0, 90000, NULL, NULL, 'Brand new/Box pack', 'Usman 6 Pro Box Pack
Box pack brand new', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (813, 60, '2024-12-06', 'Furrukh Okara 8 Pro Buyer', '03360061177', FALSE, 'f238bcf6-eede-403d-96a4-1ad5d525a9a4', NULL, NULL, NULL, 0, 108000, NULL, NULL, '3 days check warranty', 'Furrukh Okara 8 Pro Buyer
3 days check warranty for
software and battery', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (814, 59, '2024-12-06', 'Usman Zubair Pixel 8 Buyer', '03248050833', FALSE, '0c91ef8a-6440-4e14-bc6e-8671f0f9d0fe', 'Google', 'pixel 8', 'pixel 8', 1, 60000, NULL, NULL, '3 days check warranty', 'Usman Zubair Pixel 8 Buyer
3 days check warranty for
battery and software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (815, 58, '2024-12-04', 'Imran Shaukat 6a Buyer', '03004260272', FALSE, 'fba3bb0b-79f5-4e26-92e0-26b7c63ed783', 'Google', 'pixel 7', 'pixel 7', 1, 305000, NULL, NULL, 'Exchange/Adjustment', 'Imran Shaukat 6a Buyer
Cash 195k online 40k pixel 7
adjusted in 70k', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (816, 57, '2024-12-04', 'Amir 6a Buyer', '03008481849', FALSE, '6e5237be-e919-49d7-949f-2d781493170e', NULL, NULL, NULL, 0, 52000, NULL, NULL, NULL, 'Amir 6a Buyer', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (817, 56, '2024-12-04', 'Tajwar Rasheed 7 Pro CPID', '03422688086', FALSE, '9c706243-0977-4eec-a136-f868336b1a29', NULL, NULL, NULL, 0, 100000, NULL, NULL, 'CPID', 'Tajwar Rasheed 7 Pro CPID
3 days check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (818, 55, '2024-12-04', 'Shehzad Pixel 9 Black', '03218408886', FALSE, 'bb7dd964-36f7-47c5-9ee1-850434cc87eb', 'Google', 'pixel 9', 'pixel 9', 1, 200000, NULL, NULL, 'Brand new/Box pack; CPID', 'Shehzad Pixel 9 Black
box pack CPID black', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (819, 54, '2024-12-04', 'Roman Tufail 6 Buyer', '03204000628', FALSE, 'f9d9b853-ab18-4c6b-a858-2f95cb4846d7', NULL, NULL, NULL, 0, 60000, NULL, NULL, '3 days check warranty', 'Roman Tufail 6 Buyer
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (820, 53, '2024-12-03', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', NULL, NULL, NULL, 0, 170000, NULL, NULL, NULL, 'Basit Straight Way IT Tower', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (821, 52, '2024-12-02', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', NULL, NULL, NULL, 0, 230000, NULL, NULL, NULL, 'Basit Straight Way IT Tower
returned', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (822, 51, '2024-11-30', 'Hassan 6 Pro Pair', '03046970264', FALSE, 'c8829721-03a1-4b19-bb4b-2330da1bb779', NULL, NULL, NULL, 0, 122000, '128GB', NULL, 'CPID; 3 days check warranty', 'Hassan 6 Pro Pair
3 days check warranty rose
quartz 128gb CPID', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (823, 50, '2024-11-30', 'Amir Hayat', '03224608481', FALSE, '4338765e-bab2-4da7-bc60-b997e366e5d7', NULL, NULL, NULL, 0, 280000, NULL, NULL, 'Brand new/Box pack', 'Amir Hayat
Brand New box pack voilet', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (824, 49, '2024-11-30', 'Usman 8a Buyer', '03114899489', FALSE, 'c0c3a016-a5eb-4b8b-87be-52c4768b114b', NULL, NULL, NULL, 0, 92500, NULL, NULL, 'Brand new/Box pack', 'Usman 8a Buyer
8a box pack sim time over', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (825, 48, '2024-11-30', 'Basit Straight Way IT Tower', '03236062343', FALSE, '683c5e52-61c0-444a-8c83-ede447094420', NULL, NULL, NULL, 0, 293000, NULL, NULL, 'Brand new/Box pack', 'Basit Straight Way IT Tower
Brand New box pack', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (826, 1, '2024-11-29', 'Ali Danish 7 Seller', '03214984899', FALSE, '946f9e22-d714-483d-8679-8e7d47474fa0', NULL, NULL, NULL, 0, 95000, NULL, NULL, 'Brand new/Box pack; CPID', 'Ali Danish 7 Seller
box pack dual sim CPID', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (827, 47, '2024-11-29', 'Asif 7 Pro 512gb', '03454606523', FALSE, '88fe84bf-da48-42c7-9c22-c6aa1c68a6f0', NULL, NULL, NULL, 0, 116000, '512GB', NULL, 'CPID; 3 days check warranty', 'Asif 7 Pro 512gb
3 days check warranty CPID', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (828, 46, '2024-11-28', 'Illyas Park View Pixel Phone', '03114512735', FALSE, 'ada07a00-c590-48d0-a2fe-287866540371', 'Google', NULL, NULL, 0, 297000, '256GB', NULL, 'Brand new/Box pack; CPID', 'Illyas Park View Pixel Phone
Box pack 256gb Hazel CPID
TCS to Daska city', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (829, 45, '2024-11-28', 'Hafiz Hassan Pixel 9 Kit', '03040118139', FALSE, 'b99106f1-1124-490e-b6d5-a6db50a0984e', 'Google', 'pixel 9', 'pixel 9', 1, 168000, NULL, NULL, NULL, 'Hafiz Hassan Pixel 9 Kit
price inclusive of accessories
charger cable front glass back
cover', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (830, 44, '2024-11-28', 'Agha Haroon Sheikhpura 6', '03044790535', FALSE, '8ceb10f7-5686-407c-af5c-f218bdd77027', NULL, NULL, NULL, 0, 270000, NULL, NULL, 'Brand new/Box pack; CPID', 'Agha Haroon Sheikhpura 6
Buyer
brand new box pack CPID', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (831, 43, '2024-11-28', 'Azam Care Of Jahangir', '03094565537', FALSE, 'dbc70fdc-597e-495b-b2ab-dfbd83108879', NULL, NULL, NULL, 0, 67000, NULL, NULL, '3 days check warranty', 'Azam Care Of Jahangir
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (832, 42, '2024-11-28', 'Ali Buyer Lg G8 Shaikhupura', '03072155100', FALSE, 'dd9b7c25-1b2e-4ea5-9c93-2b20efb8661a', NULL, NULL, NULL, 0, 72000, NULL, NULL, '3 days check warranty', 'Ali Buyer Lg G8 Shaikhupura
3 days check warranty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (833, 41, '2024-11-28', 'Raza NCA 6a Buyer', '03087897093', FALSE, '3fee25b8-e5cc-469f-ba22-0afdea7b5592', NULL, NULL, NULL, 0, 75000, NULL, NULL, NULL, 'Raza NCA 6a Buyer
3 days check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (834, 40, '2024-11-26', 'AB Shah Pixel 7 Pro Pair With', '03024898932', FALSE, 'de12be0c-15b6-4583-9f49-d4d5308442b8', 'Google', 'pixel 7 pro', 'pixel 7 pro', 1, 65000, NULL, NULL, '3 days check warranty', 'AB Shah Pixel 7 Pro Pair With
Waqas
3 days check warranty price
inclusive of cable charger', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (835, 39, '2024-11-26', 'Zeeshan Nawaz 7 Pro Official', '03420708791', FALSE, 'a269b248-5574-4e94-87ef-40140956f0d3', NULL, NULL, NULL, 0, 126000, NULL, NULL, 'Official; 3 days check warranty', 'Zeeshan Nawaz 7 Pro Official
3 days check warranty price
inclusive of accessories', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (836, 38, '2024-11-26', 'Shoaib Pixel Back Cover', '03152290386', FALSE, '61b6e43a-580f-4f32-8e54-383f829b5586', 'Google', NULL, NULL, 0, 160000, NULL, NULL, NULL, 'Shoaib Pixel Back Cover', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (837, 37, '2024-11-25', 'Nadeem Hasnaat Pixel 8a', '03004215757', FALSE, 'fbe59c60-7172-498b-b4b7-b1b73cf892f3', 'Google', 'pixel 8a', 'pixel 8a', 1, 123000, NULL, NULL, '3 days check warranty', 'Nadeem Hasnaat Pixel 8a
3 days check warranty', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (838, 35, '2024-11-26', 'Sarwar G 04 Fazal Centre', '03474048891', FALSE, '39636990-b423-4b4b-aa76-94d18dba302e', NULL, NULL, NULL, 0, 63000, '128GB', NULL, NULL, 'Sarwar G 04 Fazal Centre
white 8gb 128gb 3 days check
warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (839, 34, '2024-11-23', 'Ahmad 6 Pro 256gb Buyer', '03019451024', FALSE, '7805875e-6e9f-49bb-99d0-560b3352c841', NULL, NULL, NULL, 0, 92000, '256GB', NULL, '3 days check warranty', 'Ahmad 6 Pro 256gb Buyer
256gb black tax paid 3 days
check warranty', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (840, 33, '2024-11-23', 'Adeel Ahmad 8 Pro 512gb', '03000418602', FALSE, '41ef7a20-225e-4b2f-8e38-ea9356ee8038', NULL, NULL, NULL, 0, 170000, '512GB', NULL, NULL, 'Adeel Ahmad 8 Pro 512gb
3 days check warrenty of
battery and software price
inclusive of accessories', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (841, 32, '2024-11-23', 'Usman 8 Pro 512gb', NULL, TRUE, 'c4201949-50bd-444d-be71-aa513cfac2f3', NULL, NULL, NULL, 0, 171000, '512GB', NULL, '3 days check warranty', 'Usman 8 Pro 512gb
3 days check warranty price
inclusive of accessories
charger back cover and glass', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (842, 31, '2024-11-28', 'Ahmad Kamal 6 Pro Buyer', '03007376891', FALSE, '22af08fd-d271-47b3-9eb7-b58c237e1b0e', NULL, NULL, NULL, 0, 97000, NULL, NULL, 'Brand new/Box pack', 'Ahmad Kamal 6 Pro Buyer
brand new box pack dual sim
PSID', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (843, 30, '2024-11-22', 'Ahsan Shaikh 6 Pro Buyer', '03214722233', FALSE, '7b1a9857-f419-44e0-98d0-e4c2a79fc26c', NULL, NULL, NULL, 0, 92000, NULL, NULL, 'Brand new/Box pack', 'Ahsan Shaikh 6 Pro Buyer
brand new phone with
complete box', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (844, 29, '2024-11-21', 'Arslan S 24 Buyer', '03336906197', FALSE, 'd1ae8239-d2b7-4591-934a-c11bef20629a', 'Samsung', 's 24', 's 24', 1, 180000, NULL, NULL, NULL, 'Arslan S 24 Buyer', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (845, 28, '2024-11-28', 'Ali Butt G 9', '03004011717', FALSE, '0cd3338b-beff-4620-8057-95c86f691a06', NULL, NULL, NULL, 0, 125000, NULL, NULL, 'Brand new/Box pack; 3 days check warranty; Has remaining balance', 'Ali Butt G 9
box pack brand new 3 days
check warranty Balance', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (846, 27, '2024-11-20', 'Haider 9 Pro XL Sahiwal', '03267555584', FALSE, 'c64b6865-c20d-4713-8950-b4c3bed110bd', NULL, NULL, NULL, 0, 315000, NULL, NULL, 'Brand new/Box pack', 'Haider 9 Pro XL Sahiwal
box pack with charger and
back cover', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (847, 26, '2024-11-20', 'Faizan Khalid 6a Buyer', '03170411910', FALSE, '8c4e6ef6-5788-4d64-ad35-8d47c650003d', NULL, NULL, NULL, 0, 219000, '256GB', NULL, 'Brand new/Box pack', 'Faizan Khalid 6a Buyer
box pack brand new voilet
colour 256gb', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (848, 25, '2024-11-20', 'Abdullah M Mobile G 13', NULL, TRUE, '59ffcc93-92ea-4020-bc34-7e0d0e3b0823', NULL, NULL, NULL, 0, 75000, NULL, NULL, NULL, 'Abdullah M Mobile G 13
Hassan Tower Opposite
Rizwan Bhai
3 days check warrenty charger
cable is due ...box is
conditional to availability', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (849, 24, '2024-11-19', 'Sufiyan Raiwind S 21 Plus', '03124005598', FALSE, '6dbc7726-4b12-4c9a-90df-a1f30e8693b5', 'Samsung', 's 21 plus', 's 21 plus', 1, 79500, NULL, NULL, NULL, 'Sufiyan Raiwind S 21 Plus
3 days check warrenty of
software and battery', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (850, 23, '2024-11-18', 'Taimoor 8a Buyer Exchange', '03470434760', FALSE, '754473f9-6240-4a98-b007-a810f5de2a79', NULL, NULL, NULL, 0, 137500, NULL, NULL, 'PTA Approved; Exchange/Adjustment', 'Taimoor 8a Buyer Exchange
single sim pta approved', 'WARNING', 'No product identified; Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (851, 22, '2024-11-21', 'Dr Ubaid 8 Pro Buyer Multan', '03305362020', FALSE, '9bec5748-3dee-4fe3-b19c-f04ce19e2f4b', NULL, NULL, NULL, 0, 165000, NULL, NULL, '3 days check warranty', 'Dr Ubaid 8 Pro Buyer Multan
3 days check warranty for
battery and software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (852, 21, '2024-11-15', 'Umar Iftikhar S 24 Exchange', '03444482587', FALSE, 'bc57bc90-d630-473d-a787-f487400f8f7b', 'Samsung', 's 24', 's 24', 1, 179000, NULL, NULL, 'Exchange/Adjustment', 'Umar Iftikhar S 24 Exchange
8a
8a adjusted in 55k 124k paid
plus 3k for pta duty....recieved
127k online', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (853, 20, '2024-11-14', 'Hamza S 24 Gulshan E Ravi', '03236196868', FALSE, '9820685d-05f5-4373-80cc-267c9535069b', 'Samsung', 's 24', 's 24', 1, 178000, '128GB', NULL, 'Brand new/Box pack; CPID', 'Hamza S 24 Gulshan E Ravi
brand new box pack CPID 8gb
128gb', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (854, 19, '2024-11-14', 'Usama Asghar Shop 123', '03167901747', FALSE, 'dc974d69-4410-4386-9545-ec33c013a34b', NULL, NULL, NULL, 0, 170000, NULL, NULL, NULL, 'Usama Asghar Shop 123
Hafeez Centre
3 days check warrenty battery
and software porcelain colour', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (855, 18, '2024-11-14', 'Umair S 24 Plus Buyer', '03216430580', FALSE, '8bb16872-e906-4530-aeac-3a9b23663a4f', 'Samsung', 's 24 plus', 's 24 plus', 1, 205000, NULL, NULL, 'Brand new/Box pack', 'Umair S 24 Plus Buyer
Gujranwala
brand new box pack', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (856, 17, '2024-11-13', 'Naseer Ahmad Furniture 7 Pro', '03239031111', FALSE, 'ef451e19-f023-40eb-9c85-788c819c7730', NULL, NULL, NULL, 0, 140000, NULL, NULL, NULL, 'Naseer Ahmad Furniture 7 Pro', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (857, 16, '2024-11-13', 'Abyaan Saeed 123 Hafeez', '03000527527', FALSE, 'd1028ed5-ff0b-4daa-98e8-9c4c371b0d9d', NULL, NULL, NULL, 0, 85000, NULL, NULL, 'CPID; 3 days check warranty', 'Abyaan Saeed 123 Hafeez
Centre
white CPID 3 days check
warranty for battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (858, 15, '2024-11-13', 'Usman 6 Pro Buyer', '03219456984', FALSE, '823d33d2-d826-446c-9087-ac8ab5bac10b', NULL, NULL, NULL, 0, 85000, NULL, NULL, NULL, 'Usman 6 Pro Buyer', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (859, 14, '2024-11-12', 'Furqan Sheikh 6a Pair', '03237242806', FALSE, '4126d311-7ca2-4449-81b4-3aca8ac9f6cb', NULL, NULL, NULL, 0, 88000, NULL, NULL, NULL, 'Furqan Sheikh 6a Pair', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (860, 13, '2024-11-12', 'DANISH_MUKHTAR Head', '03110011257', FALSE, 'e4d125ef-5685-4256-8569-85a8fcd60ca3', NULL, NULL, NULL, 0, 65000, NULL, NULL, 'Official', 'DANISH_MUKHTAR Head
Balloki 7 Pro Buyer
single sim official pta
approved', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (861, 12, '2024-11-11', 'Faizan Khalid 6a Buyer', '03170411910', FALSE, '8c4e6ef6-5788-4d64-ad35-8d47c650003d', 'Google', 'pixel 6', 'pixel 6', 1, 122000, '512GB', NULL, 'PTA Approved; CPID; Exchange/Adjustment', 'Faizan Khalid 6a Buyer
white CPID 512gb in exchange
of 60k for pixel 6 single sim
pta approved', 'INFO', 'Product from name pattern (no "N pcs"); Has payment/balance info');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (862, 11, '2024-11-11', 'Waqas 7 Pro 512gb Buyer', '03214850844', FALSE, '5922935c-abdd-4ee1-807d-21e8b4057916', NULL, NULL, NULL, 0, 116000, '512GB', NULL, 'CPID; Refurbished', 'Waqas 7 Pro 512gb Buyer
512gb CPID white original not
refurbished 3 days check
warrenty of battery and
software', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (863, 10, '2024-11-11', 'Mohammad Haseeb Mughal', '03349404855', FALSE, '1a5af6a3-a7ed-44fc-b192-e49e8efa1dd4', 'Google', NULL, NULL, 0, 131000, '128GB', NULL, 'Brand new/Box pack', 'Mohammad Haseeb Mughal
Pixel Dealer Lahore
MINT BRAND NEW 128GB
OEM UNLOCK', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (864, 9, '2024-11-09', 'Saad Pixel 7 Buyer', '03218877663', FALSE, '7f28ca87-3583-4ae3-8a6a-2966b4ec2032', 'Google', 'pixel 7', 'pixel 7', 1, 85000, '128GB', NULL, 'CPID', 'Saad Pixel 7 Buyer
7 128gb CPID 3 days check
warrenty for batter software', 'INFO', 'Product from name pattern (no "N pcs")');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (865, 8, '2024-11-09', 'Hassan Raja IT Tower Mobile', '03200401030', FALSE, '183e6848-b8a2-4835-a833-e79723f4db80', NULL, NULL, NULL, 0, 80000, '256GB', NULL, 'Non-PTA', 'Hassan Raja IT Tower Mobile
256gb non pta physical sim
time over', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (866, 7, '2024-11-08', 'Mani Yahya Mobile Liaqat', '03030970305', FALSE, 'bcac4f49-102e-4f20-bfd2-b746dbaabfda', NULL, NULL, NULL, 0, 143000, '128GB', NULL, 'CPID', 'Mani Yahya Mobile Liaqat
Chowk Sahiwal Mani
black CPID 128gb 3 days
check warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (867, 6, '2024-11-08', 'Talha 6a Buyer', '03214787963', FALSE, 'e2e77be8-1753-49cb-8a44-06ee031bc0f1', NULL, NULL, NULL, 0, 120000, NULL, NULL, '3 days check warranty', 'Talha 6a Buyer
3 days check warranty for
software and battery', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (868, 5, '2024-11-08', 'Awais 6 Pro Buyer Kahna', '03247115174', FALSE, 'd66ab436-14b0-4b12-9a04-d44d92519967', NULL, NULL, NULL, 0, 89000, NULL, NULL, 'CPID', 'Awais 6 Pro Buyer Kahna
CPID with cable charger 3
days battery warrenty', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (869, 4, '2024-11-08', 'Furrukh Okara 8 Pro Buyer', '03360061177', FALSE, 'f238bcf6-eede-403d-96a4-1ad5d525a9a4', NULL, NULL, NULL, 0, 152000, NULL, NULL, 'Non-PTA; CPID', 'Furrukh Okara 8 Pro Buyer
porcelain CPID non pta', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (870, 3, '2024-11-08', 'Hanzala Iftikhar', '03062402824', FALSE, '4bb4c5a6-314d-45e8-897b-888ea83d05ed', NULL, NULL, NULL, 0, 55000, NULL, NULL, NULL, 'Hanzala Iftikhar
GREEN COLOUR CONDITION
NEW', 'WARNING', 'No product identified');
INSERT INTO legacy_bills (row_num, bill_num, bill_date, customer_name, phone, phone_missing, customer_id, brand, primary_product, all_products, qty, amount, storage, imei, condition_notes, raw_details, severity, doubt_reasons) VALUES (871, 2, '2024-11-28', 'Faisal Butt G 1 Fazal Trade', '03236009000', FALSE, '8983a46c-8b19-439e-b644-a40b546f8636', NULL, NULL, NULL, 0, 175000, '128GB', NULL, 'Brand new/Box pack', 'Faisal Butt G 1 Fazal Trade
Centre
brand new box pack online pta
approved black 128gb', 'WARNING', 'No product identified');

-- Inserted: 871 bills
-- Linked to customers: 869
-- Skipped (bad date): 0