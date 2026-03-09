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
            <form id="analyze-form" method="POST" action="{{ route('reading.analyze') }}">
                @csrf
                <label for="text" class="block text-sm font-medium text-gray-700">生成したい英語テーマ</label>
                <textarea
                id="text"
                maxlength="100"
                name="text"
                rows="3"
                class="mt-1 block w-full border rounded p-2 h-24 overflow-y-auto resize-y"
                required
                >{{ old('text', $text ?? '') }}</textarea>


                <label for="level" class="block mt-3 text-sm font-medium text-gray-700">難易度</label>
                <select id="level" name="level" class="mt-1 block w-full border rounded p-2">
                    <option value="junior_high_school" {{ old('level', $level ?? 'high_school') === 'junior_high_school' ? 'selected' : '' }}>中学3年レベル</option>
                    <option value="high_school" {{ old('level', $level ?? 'high_school') === 'high_school' ? 'selected' : '' }}>高校3年レベル</option>
                    <option value="business" {{ old('level', $level ?? 'high_school') === 'business' ? 'selected' : '' }}>ビジネスレベル</option>
                    <option value="news" {{ old('level', $level ?? 'high_school') === 'news' ? 'selected' : '' }}>ニュースレベル</option>
                    <option value="native" {{ old('level', $level ?? 'high_school') === 'native' ? 'selected' : '' }}>ネイティブレベル</option>
                </select>

                <div class="mt-3 flex items-center gap-3">
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">生成する</button>
                    <span class="text-xs text-gray-600">本日残：{{ $remaining ?? 30 }}</span>
                </div>

            </form>
        </div>

        <div class="bg-white p-4 sm:p-6 shadow sm:rounded-lg">
            <h3 class="font-semibold mb-2">再生ボタン</h3>

            <div class="mb-3 flex flex-wrap items-center gap-3">
                <button id="play" type="button" class="px-4 py-2 bg-gray-800 text-white rounded">▶ 再生</button>
                <label for="speed_rate" class="text-sm text-gray-700">Speed</label>
                <select id="speed_rate" class="border rounded px-2 py-1 text-sm">
                    <option value="0.8">0.8x</option>
                    <option value="1.0" selected>1.0x</option>
                    <option value="1.2">1.2x</option>
                    <option value="1.5">1.5x</option>
                </select>
            </div>

            <pre id="output" class="whitespace-pre-wrap text-sm">{{ $result ?? '' }}</pre>

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
                <h3 class="font-semibold mb-3">保存履歴</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border min-w-[700px]">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-2 border text-left">ID</th>
                                <th class="p-2 border text-left">Title</th>
                                <th class="p-2 border text-left">Content</th>
                                <th class="p-2 border text-left">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($readings as $reading)
                                <tr data-content="{{ $reading->content }}">
                                    <td class="p-2 border">{{ $loop->iteration }}</td>
                                    <td class="p-2 border">{{ $reading->title }}</td>
                                    <td class="p-2 border whitespace-pre-wrap">{{ $reading->content }}</td>
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
