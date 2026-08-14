-- ============================================
-- CityFlow Seed Data
-- Initial municipal departments and categories
-- ============================================

-- Departments
INSERT INTO departments (name, description)
VALUES
    ('Fen İşleri Müdürlüğü', 'Yol, kaldırım ve altyapı bakım hizmetleri'),
    ('Temizlik İşleri Müdürlüğü', 'Çöp toplama ve çevre temizliği hizmetleri'),
    ('Park ve Bahçeler Müdürlüğü', 'Park, yeşil alan ve ağaç bakım hizmetleri'),
    ('Zabıta Müdürlüğü', 'Denetim ve belediye düzeni hizmetleri'),
    ('Ulaşım Müdürlüğü', 'Trafik, ulaşım ve yol güvenliği hizmetleri'),
    ('Aydınlatma Birimi', 'Sokak ve çevre aydınlatma hizmetleri');


-- Request Categories
INSERT INTO request_categories (name, description, department_id)
VALUES
    (
        'Yol ve Kaldırım',
        'Bozuk yol, çukur veya hasarlı kaldırım bildirimi',
        (SELECT id FROM departments WHERE name = 'Fen İşleri Müdürlüğü')
    ),
    (
        'Çöp Toplama',
        'Toplanmayan veya düzensiz bırakılan çöpler',
        (SELECT id FROM departments WHERE name = 'Temizlik İşleri Müdürlüğü')
    ),
    (
        'Park Bakımı',
        'Park ve yeşil alanlardaki bakım sorunları',
        (SELECT id FROM departments WHERE name = 'Park ve Bahçeler Müdürlüğü')
    ),
    (
        'Sokak Lambası',
        'Çalışmayan veya hasarlı sokak lambaları',
        (SELECT id FROM departments WHERE name = 'Aydınlatma Birimi')
    ),
    (
        'Trafik Sorunu',
        'Trafik işaretleri, sinyalizasyon veya ulaşım sorunları',
        (SELECT id FROM departments WHERE name = 'Ulaşım Müdürlüğü')
    ),
    (
        'Zabıta Bildirimi',
        'Belediye düzeni ve denetimle ilgili bildirimler',
        (SELECT id FROM departments WHERE name = 'Zabıta Müdürlüğü')
    );