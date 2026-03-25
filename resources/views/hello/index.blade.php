<x-app-layout>
    <div class="py-4 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        @if($errors->any())
            <div class="bg-red-100 text-red-800 p-3 rounded">
                {{ $errors->first() }}
            </div>
        @endif

        @if(session('status'))
            <div class="bg-green-100 text-green-800 p-3 rounded">
                {{ session('status') }}
            </div>
        @endif

        <div class="bg-white p-4 sm:p-6 shadow sm:rounded-lg">
            <span class="text-xs text-gray-600">本日残：{{ $remaining ?? 30 }}</span>

            <details class="mt-3 rounded-lg border border-gray-200 bg-gray-50">
                <summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-800">
                    生成したい英文のテーマを入力する（例：イラン革命防衛隊について）
                </summary>

                <form id="analyze-form" method="POST" action="{{ route('reading.analyze') }}" class="space-y-4 border-t border-gray-200 bg-white px-4 py-4">
                    @csrf

                    <div>
                        <label for="text" class="block text-sm font-medium text-gray-700">テーマ</label>
                        <textarea
                            id="text"
                            maxlength="100"
                            name="text"
                            rows="3"
                            class="mt-1 block w-full border rounded p-2 h-24 overflow-y-auto resize-y"
                            required
                        >{{ old('text', $text ?? '') }}</textarea>
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div class="flex-1">
                            <label for="level" class="block text-sm font-medium text-gray-700">難易度</label>
                            <select id="level" name="level" class="mt-1 block w-full border rounded p-2">
                                <option value="junior_high_school" {{ old('level', $level ?? 'high_school') === 'junior_high_school' ? 'selected' : '' }}>中学3年レベル</option>
                                <option value="high_school" {{ old('level', $level ?? 'high_school') === 'high_school' ? 'selected' : '' }}>高校3年レベル</option>
                                <option value="business" {{ old('level', $level ?? 'high_school') === 'business' ? 'selected' : '' }}>ビジネスレベル</option>
                                <option value="news" {{ old('level', $level ?? 'high_school') === 'news' ? 'selected' : '' }}>ニュースレベル</option>
                                <option value="native" {{ old('level', $level ?? 'high_school') === 'native' ? 'selected' : '' }}>ネイティブレベル</option>
                            </select>
                        </div>

                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded sm:whitespace-nowrap">生成</button>
                    </div>
                </form>
            </details>
        </div>

        <div class="bg-white p-4 sm:p-6 shadow sm:rounded-lg">
            <h3 class="font-semibold mb-2">再生エリア</h3>

            <div class="mb-3 flex flex-wrap items-center gap-2">
                <label for="voice_select" class="text-sm text-gray-700">音声</label>
                <select id="voice_select" class="border rounded px-2 py-1 text-sm max-w-[280px]">
                    <option value="">Loading voices...</option>
                </select>
                <label for="speed_rate" class="text-sm text-gray-700">Speed</label>
                <select id="speed_rate" class="border rounded px-2 py-1 text-sm">
                    <option value="0.8">0.8x</option>
                    <option value="1.0" selected>1.0x</option>
                    <option value="1.2">1.2x</option>
                    <option value="1.5">1.5x</option>
                </select>
                <button id="play" type="button" class="flex h-10 w-10 items-center justify-center rounded bg-gray-800 text-sm text-white" aria-label="再生" title="再生">▶</button>
                <button id="next_story" type="button" class="flex h-10 w-10 items-center justify-center rounded bg-gray-600 text-sm text-white" aria-label="次へ" title="次へ">⏭</button>
                <button id="random_story" type="button" class="flex h-10 w-10 items-center justify-center rounded bg-gray-500 text-sm text-white" aria-label="ランダム" title="ランダム">⇄</button>
            </div>

            <pre id="output" class="whitespace-pre-wrap text-[17px] sm:text-sm leading-relaxed sm:leading-normal px-1 sm:px-0">{{ $result ?? '' }}</pre>

            @isset($result)
                <form method="POST" action="{{ route('reading.store') }}" class="mt-4">
                    @csrf
                    <input type="hidden" name="text" value="{{ $text ?? '' }}">
                    <input type="hidden" name="result" value="{{ $result }}">
                    <button
                        type="submit"
                        class="px-4 py-2 rounded border border-gray-400 bg-green-600 text-white font-semibold"
                        style="color:#fff; background:#16a34a;"
                    >この結果を保存</button>
                </form>
            @endisset
        </div>

        @if(isset($readings) && $readings->count())
            <div class="bg-white p-4 sm:p-6 shadow sm:rounded-lg">
                <h3 class="font-semibold mb-3">生成作品</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border min-w-[700px]">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-2 border text-left">ID</th>
                                <th class="p-2 border text-left">Title</th>
                                <th class="p-2 border text-left">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($readings as $reading)
                                <tr data-content="{{ $reading->content }}">
                                    <td class="p-2 border">{{ $loop->iteration }}</td>
                                    <td class="p-2 border">{{ $reading->title }}</td>
                                    <td class="p-2 border">
                                        <form method="POST" action="{{ route('reading.destroy', $reading) }}">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="px-3 py-1 bg-red-600 text-white rounded">削除</button>
                                        </form>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        @endif
    </div>
</x-app-layout>




