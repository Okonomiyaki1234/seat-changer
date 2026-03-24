'use client';

import { useState } from 'react';
import { supabase, Student, SeatLayout, ClassroomTemplate } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shuffle, Save, Upload, Plus, X, Grid3x3, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const [classCode, setClassCode] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState<ClassroomTemplate | null>(null);
  const [seatLayout, setSeatLayout] = useState<SeatLayout>({ rows: 6, cols: 6, disabled: [] });
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [assignments, setAssignments] = useState<(Student | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplate = async () => {
    if (!classCode.trim()) {
      toast.error('クラスコードを入力してください');
      return;
    }

    if (!supabase) {
      toast.error('データベース接続がありません');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classroom_templates')
        .select('*')
        .eq('class_code', classCode.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentTemplate(data);
        setSeatLayout(data.seat_layout);
        setStudents(data.students);
        toast.success('テンプレートを読み込みました');
      } else {
        setSeatLayout({ rows: 6, cols: 6, disabled: [] });
        setStudents([]);
        setCurrentTemplate(null);
        toast.info('新しいテンプレートを作成します');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('テンプレートの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!classCode.trim()) {
      toast.error('クラスコードを入力してください');
      return;
    }

    if (!supabase) {
      toast.error('データベース接続がありません');
      return;
    }

    setIsLoading(true);
    try {
      const templateData = {
        class_code: classCode.trim(),
        seat_layout: seatLayout,
        students: students,
        updated_at: new Date().toISOString(),
      };

      if (currentTemplate) {
        const { error } = await supabase
          .from('classroom_templates')
          .update(templateData)
          .eq('id', currentTemplate.id);

        if (error) throw error;
        toast.success('テンプレートを更新しました');
      } else {
        const { data, error } = await supabase
          .from('classroom_templates')
          .insert([templateData])
          .select()
          .single();

        if (error) throw error;
        setCurrentTemplate(data);
        toast.success('テンプレートを保存しました');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('テンプレートの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = () => {
    if (!newStudentName.trim()) return;

    setStudents([...students, { name: newStudentName.trim(), preferFront: false }]);
    setNewStudentName('');
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const togglePreferFront = (index: number) => {
    const updated = [...students];
    updated[index].preferFront = !updated[index].preferFront;
    setStudents(updated);
  };

  const toggleSeat = (seatIndex: number) => {
    const disabled = [...seatLayout.disabled];
    const idx = disabled.indexOf(seatIndex);

    if (idx > -1) {
      disabled.splice(idx, 1);
    } else {
      disabled.push(seatIndex);
    }

    setSeatLayout({ ...seatLayout, disabled });
  };

  const shuffleSeats = () => {
    const totalSeats = seatLayout.rows * seatLayout.cols;
    const availableSeats = Array.from({ length: totalSeats }, (_, i) => i)
      .filter(i => !seatLayout.disabled.includes(i));

    if (students.length > availableSeats.length) {
      toast.error('生徒数が利用可能な席数を超えています');
      return;
    }

    const halfPoint = Math.floor(seatLayout.rows / 2) * seatLayout.cols;
    const frontSeats = availableSeats.filter(s => s < halfPoint);
    const allSeatsShuffled = [...availableSeats].sort(() => Math.random() - 0.5);
    const frontSeatsShuffled = [...frontSeats].sort(() => Math.random() - 0.5);

    const preferFrontStudents = students.filter(s => s.preferFront);
    const normalStudents = students.filter(s => !s.preferFront);

    const result: (Student | null)[] = Array(totalSeats).fill(null);
    let frontIndex = 0;
    let allIndex = 0;

    preferFrontStudents.forEach(student => {
      if (frontIndex < frontSeatsShuffled.length) {
        result[frontSeatsShuffled[frontIndex]] = student;
        const usedSeatIndex = allSeatsShuffled.indexOf(frontSeatsShuffled[frontIndex]);
        allSeatsShuffled.splice(usedSeatIndex, 1);
        frontIndex++;
      }
    });

    normalStudents.forEach(student => {
      if (allIndex < allSeatsShuffled.length) {
        result[allSeatsShuffled[allIndex]] = student;
        allIndex++;
      }
    });

    setAssignments(result);
    toast.success('席替えを実行しました！');
  };

  const getSeatNumber = (index: number) => {
    const row = Math.floor(index / seatLayout.cols);
    const col = index % seatLayout.cols;
    return `${row + 1}-${col + 1}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8">
      <Toaster />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            席替えアプリ
          </h1>
          <p className="text-gray-600">クラスの席をランダムに配置します</p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              クラスコード
            </CardTitle>
            <CardDescription>
              学年とクラスのコード（例: 2024-3A）を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="例: 2024-3A"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTemplate()}
                className="text-lg"
              />
              <Button onClick={loadTemplate} disabled={isLoading} className="gap-2">
                <Upload className="w-4 h-4" />
                読み込み
              </Button>
              <Button onClick={saveTemplate} disabled={isLoading || !classCode} className="gap-2">
                <Save className="w-4 h-4" />
                保存
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              生徒管理
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              席レイアウト
            </TabsTrigger>
            <TabsTrigger value="result" className="gap-2">
              <Shuffle className="w-4 h-4" />
              席替え実行
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>生徒リスト ({students.length}名)</CardTitle>
                <CardDescription>
                  生徒を追加し、前側希望の設定をしてください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="生徒名を入力"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStudent()}
                  />
                  <Button onClick={addStudent} className="gap-2">
                    <Plus className="w-4 h-4" />
                    追加
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {students.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium text-gray-700">{student.name}</span>
                        {student.preferFront && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            前側希望
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`prefer-${index}`} className="text-sm">
                            前側
                          </Label>
                          <Switch
                            id={`prefer-${index}`}
                            checked={student.preferFront}
                            onCheckedChange={() => togglePreferFront(index)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStudent(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {students.length === 0 && (
                  <p className="text-center text-gray-400 py-8">
                    生徒を追加してください
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>席のレイアウト設定</CardTitle>
                <CardDescription>
                  行数と列数を設定し、使用しない席をクリックして選択してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>行数</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={seatLayout.rows}
                      onChange={(e) => setSeatLayout({ ...seatLayout, rows: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>列数</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={seatLayout.cols}
                      onChange={(e) => setSeatLayout({ ...seatLayout, cols: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="mb-4 text-center">
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      黒板・前方向
                    </Badge>
                  </div>

                  <div
                    className="grid gap-2 mx-auto"
                    style={{
                      gridTemplateColumns: `repeat(${seatLayout.cols}, minmax(0, 1fr))`,
                      maxWidth: `${seatLayout.cols * 80}px`,
                    }}
                  >
                    {Array.from({ length: seatLayout.rows * seatLayout.cols }).map((_, index) => {
                      const isDisabled = seatLayout.disabled.includes(index);
                      return (
                        <button
                          key={index}
                          onClick={() => toggleSeat(index)}
                          className={`
                            aspect-square rounded-lg border-2 transition-all hover:scale-105
                            flex items-center justify-center text-xs font-medium
                            ${isDisabled
                              ? 'bg-gray-300 border-gray-400 text-gray-500 line-through'
                              : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
                            }
                          `}
                        >
                          {getSeatNumber(index)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-center text-sm text-gray-600">
                    利用可能な席: {seatLayout.rows * seatLayout.cols - seatLayout.disabled.length}席
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="result">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>席替え実行</CardTitle>
                <CardDescription>
                  ランダムに席を配置します。前側希望の生徒は前半の席に優先配置されます。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={shuffleSeats}
                  disabled={students.length === 0}
                  size="lg"
                  className="w-full gap-2 text-lg h-14"
                >
                  <Shuffle className="w-5 h-5" />
                  席替えを実行
                </Button>

                {assignments.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="mb-4 text-center">
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        黒板・前方向
                      </Badge>
                    </div>

                    <div
                      className="grid gap-2 mx-auto"
                      style={{
                        gridTemplateColumns: `repeat(${seatLayout.cols}, minmax(0, 1fr))`,
                        maxWidth: `${seatLayout.cols * 120}px`,
                      }}
                    >
                      {assignments.map((student, index) => {
                        const isDisabled = seatLayout.disabled.includes(index);
                        const isFrontHalf = index < Math.floor(seatLayout.rows / 2) * seatLayout.cols;

                        return (
                          <div
                            key={index}
                            className={`
                              aspect-square rounded-lg border-2 p-2
                              flex flex-col items-center justify-center text-center
                              transition-all
                              ${isDisabled
                                ? 'bg-gray-200 border-gray-300'
                                : student
                                  ? isFrontHalf && student.preferFront
                                    ? 'bg-blue-100 border-blue-400 shadow-md'
                                    : 'bg-white border-gray-300 shadow-sm'
                                  : 'bg-gray-50 border-gray-200'
                              }
                            `}
                          >
                            {!isDisabled && student && (
                              <>
                                <div className="text-xs text-gray-500 mb-1">
                                  {getSeatNumber(index)}
                                </div>
                                <div className="text-sm font-semibold text-gray-800 break-words w-full">
                                  {student.name}
                                </div>
                                {student.preferFront && (
                                  <Badge variant="secondary" className="mt-1 text-xs bg-blue-200 text-blue-800">
                                    前側
                                  </Badge>
                                )}
                              </>
                            )}
                            {!isDisabled && !student && (
                              <div className="text-xs text-gray-400">空席</div>
                            )}
                            {isDisabled && (
                              <div className="text-xs text-gray-400">×</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignments.length === 0 && (
                  <p className="text-center text-gray-400 py-12">
                    席替えを実行すると、ここに結果が表示されます
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
