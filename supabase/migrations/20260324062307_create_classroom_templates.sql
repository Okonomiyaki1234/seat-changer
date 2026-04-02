/*
  # 席替えアプリのテーブル作成

  1. 新しいテーブル
    - `classroom_templates`
      - `id` (uuid, primary key) - 一意識別子
      - `class_code` (text, unique) - クラスコード（例: "2024-3A"）
      - `seat_layout` (jsonb) - 席の配置情報（行数、列数、無効な席など）
      - `students` (jsonb) - 生徒リスト（名前、前側希望フラグ）
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. セキュリティ
    - RLSを有効化
    - 誰でも読み取り・作成・更新可能なポリシーを追加（特定学校内での使用想定）
*/

CREATE TABLE IF NOT EXISTS classroom_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text UNIQUE NOT NULL,
  seat_layout jsonb DEFAULT '{"rows": 6, "cols": 6, "disabled": []}'::jsonb,
  students jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE classroom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read classroom templates"
  ON classroom_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert classroom templates"
  ON classroom_templates
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update classroom templates"
  ON classroom_templates
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_classroom_templates_class_code ON classroom_templates(class_code);