<?php

namespace App\Http\Controllers;

use App\Models\Reading;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;



class ReadingController extends Controller
{
    public function index()
    {
        $readings = Reading::where('user_id', auth()->id())
            ->latest()
            ->get();

        $todayKey = 'reading:daily:' . auth()->id() . ':' . now()->format('Ymd');
        $used = (int) Cache::get($todayKey, 0);
        $remaining = max(0, 30 - $used);

        return view('hello.index', compact('readings', 'remaining'));
    }


    public function analyze(Request $request)
    {

        $userId = auth()->id();
        $todayKey = 'reading:daily:' . $userId . ':' . now()->format('Ymd');
        $limit = 30;
        $used = (int) Cache::get($todayKey, 0);

        if ($used >= $limit) {
            return back()->withErrors(['text' => '本日の利用上限（30回）に達しました。'])->withInput();
        }

        $data = $request->validate([
            'text' => ['required', 'string', 'max:100'],
            'level' => ['required', 'in:junior_high_school,high_school,business,news,native'],
        ]);

        $levelMap = [
            'junior_high_school' => 'very simple English for Japanese junior high school students',
            'high_school' => 'standard English for Japanese high school students',
            'business' => 'business English focused on comprehension rather than fluent speaking',
            'news' => 'neutral news-style English',
            'native' => 'natural native-level English',
        ];

        $prompt = "Write an English passage between 110 and 130 words.\n"
            . "Difficulty of vocabulary and sentence length: " . $levelMap[$data['level']] . "\n"
            . "Theme: " . $data['text'] . "\n"
            . "Do not include any introductions, explanations, or meta comments. "
            . "Output only the English passage.";

        $apiKey = config('services.gemini.key');
        if (!$apiKey) {
            return back()->withErrors(['text' => 'GEMINI_API_KEY is missing'])->withInput();
        }

        $response = Http::timeout(30)->post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' . urlencode($apiKey),
            [
                'contents' => [[
                    'parts' => [[
                        'text' => $prompt,
                    ]],
                ]],
            ]
        );

        $result = data_get($response->json(), 'candidates.0.content.parts.0.text');

        if (!$response->ok() || !$result) {
            return back()->withErrors(['text' => 'Gemini API request failed'])->withInput();
        }

        Cache::put($todayKey, $used + 1, now()->endOfDay());


        $readings = Reading::where('user_id', auth()->id())
            ->latest()
            ->get();
        $remaining = max(0, 30 - ($used + 1)); // 追加

        return view('hello.index', [
            'text' => $data['text'],
            'level' => $data['level'],
            'result' => $result,
            'readings' => $readings,
            'remaining' => $remaining, // 追加
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(
            [
                'text' => ['required', 'string', 'max:100'],
                'result' => ['required', 'string', 'max:1000'],
            ],
            [
                'text.required' => 'テーマを入力してください。',
                'text.max' => 'テーマは100文字以内で入力してください。',
                'result.required' => '保存する結果がありません。',
                'result.max' => '結果が長すぎます（1000文字以内）。',
            ]
        );

        // 保存時に「*」と改行を除去
        $cleanResult = Str::of($data['result'])
            ->replace(["\r\n", "\r", "\n"], ' ')
            ->replace('*', '')
            ->squish()
            ->toString();

        Reading::create([
            'user_id' => auth()->id(),
            'title' => $data['text'],
            'content' => $cleanResult,
        ]);

        return redirect()->route('reading.index')->with('status', '保存しました');
    }

    public function destroy(Reading $reading)
    {
        if ($reading->user_id !== auth()->id()) {
            abort(403);
        }

        $reading->delete();

        return redirect()->route('reading.index')->with('status', '削除しました');
    }
}
