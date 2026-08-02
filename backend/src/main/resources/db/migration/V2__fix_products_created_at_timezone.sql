-- 💡 Product.createdAt(Instant)는 Hibernate가 TIMESTAMP_UTC로 검증하는데, V1 베이스라인 시점 실제 DB
-- 컬럼은 timezone 없는 timestamp였다(추가할 때의 실수). orders.created_at처럼 timestamptz로 맞춘다.
ALTER TABLE products
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
