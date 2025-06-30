-- Migration: Add mock client data for testing and development
-- This migration adds 20 realistic Algerian clients with complete information

INSERT INTO clients (name, company, email, phone, address, notes, nif, nis, rc, ai, rib, credit_balance) VALUES
-- Construction Companies
('Ahmed Benali', 'Constructions Benali SARL', 'ahmed.benali@constructions-benali.dz', '+213 21 45 67 89', '123 Rue Didouche Mourad, Alger Centre, 16000 Alger', 'Specialized in residential construction. Reliable payment history.', '123456789012345', '987654321098765', 'RC123456789', 'AI987654321', 'RIB123456789012345678901234', 0.00),
('Fatima Zerrouki', 'Zerrouki Construction', 'contact@zerrouki-construction.dz', '+213 23 45 67 89', '456 Avenue des Martyrs, Oran, 31000 Oran', 'Commercial construction projects. Prefers bank transfers.', '234567890123456', '876543210987654', 'RC234567890', 'AI876543210', 'RIB234567890123456789012345', 1500.50),
('Mohammed Boudiaf', 'Boudiaf Engineering', 'm.boudiaf@boudiaf-eng.dz', '+213 25 67 89 01', '789 Boulevard Zighout Youcef, Constantine, 25000 Constantine', 'Infrastructure projects. Large volume client.', '345678901234567', '765432109876543', 'RC345678901', 'AI765432109', 'RIB345678901234567890123456', 0.00),

-- Steel and Metal Companies
('Karim Messaoudi', 'Messaoudi Steel Industries', 'k.messaoudi@messaoudi-steel.dz', '+213 27 89 01 23', '321 Zone Industrielle, Annaba, 23000 Annaba', 'Steel processing and distribution. Regular monthly orders.', '456789012345678', '654321098765432', 'RC456789012', 'AI654321098', 'RIB456789012345678901234567', 2500.75),
('Samira Hadid', 'Hadid Metal Works', 'samira@hadid-metal.dz', '+213 29 01 23 45', '654 Rue de la République, Tlemcen, 13000 Tlemcen', 'Custom metal fabrication. High-quality requirements.', '567890123456789', '543210987654321', 'RC567890123', 'AI543210987', 'RIB567890123456789012345678', 0.00),
('Youssef Khelifi', 'Khelifi Steel Trading', 'y.khelifi@khelifi-trading.dz', '+213 31 23 45 67', '987 Avenue du 1er Novembre, Sétif, 19000 Sétif', 'Steel trading and distribution. Competitive pricing needed.', '678901234567890', '432109876543210', 'RC678901234', 'AI432109876', 'RIB678901234567890123456789', 1800.25),

-- Manufacturing Companies
('Leila Mansouri', 'Mansouri Manufacturing', 'leila@mansouri-mfg.dz', '+213 33 45 67 89', '147 Rue de la Liberté, Batna, 05000 Batna', 'Industrial manufacturing. Bulk orders with credit terms.', '789012345678901', '321098765432109', 'RC789012345', 'AI321098765', 'RIB789012345678901234567890', 3200.00),
('Rachid Bouzid', 'Bouzid Industries', 'r.bouzid@bouzid-ind.dz', '+213 35 67 89 01', '258 Zone d''Activité, Blida, 09000 Blida', 'Automotive parts manufacturing. Just-in-time delivery.', '890123456789012', '210987654321098', 'RC890123456', 'AI210987654', 'RIB890123456789012345678901', 0.00),
('Nadia Cherif', 'Cherif Textiles', 'nadia@cherif-textiles.dz', '+213 37 89 01 23', '369 Rue du Commerce, Tizi Ouzou, 15000 Tizi Ouzou', 'Textile manufacturing. Seasonal ordering patterns.', '901234567890123', '109876543210987', 'RC901234567', 'AI109876543', 'RIB901234567890123456789012', 950.75),

-- Retail and Distribution
('Hassan Benmoussa', 'Benmoussa Distribution', 'hassan@benmoussa-dist.dz', '+213 39 01 23 45', '741 Avenue de l''Indépendance, Béjaïa, 06000 Béjaïa', 'Retail distribution network. Multiple locations.', '012345678901234', '098765432109876', 'RC012345678', 'AI098765432', 'RIB012345678901234567890123', 0.00),
('Amina Bouchama', 'Bouchama Retail', 'amina@bouchama-retail.dz', '+213 41 23 45 67', '852 Rue de la Paix, Mostaganem, 27000 Mostaganem', 'Consumer goods retail. Weekly delivery schedule.', '123456789012345', '987654321098765', 'RC123456789', 'AI987654321', 'RIB123456789012345678901234', 1200.50),
('Omar Tounsi', 'Tounsi Trading Co.', 'omar@tounsi-trading.dz', '+213 43 45 67 89', '963 Boulevard de la Révolution, Tiaret, 14000 Tiaret', 'Import/export trading. International payment methods.', '234567890123456', '876543210987654', 'RC234567890', 'AI876543210', 'RIB234567890123456789012345', 2800.00),

-- Service Companies
('Djamila Benatia', 'Benatia Services', 'djamila@benatia-services.dz', '+213 45 67 89 01', '159 Rue des Entrepreneurs, Djelfa, 17000 Djelfa', 'Business services. Flexible payment terms.', '345678901234567', '765432109876543', 'RC345678901', 'AI765432109', 'RIB345678901234567890123456', 0.00),
('Khalil Meziane', 'Meziane Consulting', 'khalil@meziane-consulting.dz', '+213 47 89 01 23', '357 Avenue des Affaires, Laghouat, 03000 Laghouat', 'Management consulting. Project-based billing.', '456789012345678', '654321098765432', 'RC456789012', 'AI654321098', 'RIB456789012345678901234567', 750.25),
('Souad Hamidi', 'Hamidi Logistics', 'souad@hamidi-logistics.dz', '+213 49 01 23 45', '486 Rue du Transport, El Oued, 39000 El Oued', 'Logistics and transportation. Fuel surcharge applicable.', '567890123456789', '543210987654321', 'RC567890123', 'AI543210987', 'RIB567890123456789012345678', 1600.75),

-- Small Businesses
('Mourad Kaci', 'Kaci Hardware Store', 'mourad@kaci-hardware.dz', '+213 51 23 45 67', '753 Rue du Marché, Ghardaïa, 47000 Ghardaïa', 'Local hardware store. Cash on delivery preferred.', '678901234567890', '432109876543210', 'RC678901234', 'AI432109876', 'RIB678901234567890123456789', 0.00),
('Yasmina Boudjemaa', 'Boudjemaa Artisan Shop', 'yasmina@boudjemaa-artisan.dz', '+213 53 45 67 89', '951 Rue de l''Artisanat, Ouargla, 30000 Ouargla', 'Traditional artisan products. Small orders, regular customer.', '789012345678901', '321098765432109', 'RC789012345', 'AI321098765', 'RIB789012345678901234567890', 450.00),
('Tarek Saadi', 'Saadi Electronics', 'tarek@saadi-electronics.dz', '+213 55 67 89 01', '264 Avenue de la Technologie, Biskra, 07000 Biskra', 'Electronics retail. Credit card payments accepted.', '890123456789012', '210987654321098', 'RC890123456', 'AI210987654', 'RIB890123456789012345678901', 0.00),
('Hakima Belkacemi', 'Belkacemi Furniture', 'hakima@belkacemi-furniture.dz', '+213 57 89 01 23', '837 Rue de l''Artisan, Médéa, 26000 Médéa', 'Custom furniture manufacturing. Premium quality materials.', '901234567890123', '109876543210987', 'RC901234567', 'AI109876543', 'RIB901234567890123456789012', 2100.50);

-- Add some clients with different credit balance scenarios
INSERT INTO clients (name, company, email, phone, address, notes, nif, nis, rc, ai, rib, credit_balance) VALUES
('Malik Benchaabane', 'Benchaabane Construction', 'malik@benchaabane.dz', '+213 59 01 23 45', '148 Rue de la Construction, Chlef, 02000 Chlef', 'New client, needs credit evaluation.', '123456789012346', '987654321098766', 'RC123456790', 'AI987654322', 'RIB123456789012345678901235', -500.00),
('Nawel Khelil', 'Khelil Industries', 'nawel@khelil.dz', '+213 61 23 45 67', '259 Zone Industrielle, Mascara, 29000 Mascara', 'Established client with good credit history.', '123456789012347', '987654321098767', 'RC123456791', 'AI987654323', 'RIB123456789012345678901236', 3500.75); 