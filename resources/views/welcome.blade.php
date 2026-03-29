<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'ShadUp') }}</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        .hero-bg {
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            background: url('{{ asset('top/images/pc.png') }}') center center / cover no-repeat;
        }

        @media (max-width: 639px) {
            .hero-bg {
                background-image: url('{{ asset('top/images/mobile.png') }}');
            }
        }

        .hero-title {
            text-shadow: 0 3px 18px rgba(0, 0, 0, 0.45);
        }

        .glass-panel {
            width: min(92vw, 720px);
            border: 1px solid rgba(255, 255, 255, 0.24);
            background: rgba(10, 10, 14, 0.30);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
        }
    </style>
</head>
<body class="min-h-screen bg-black text-white">
    <div class="hero-bg"></div>
    <div class="fixed inset-0 bg-black/38 pointer-events-none" style="z-index:10"></div>

    <main class="relative flex min-h-screen items-center justify-center px-4 py-8" style="z-index:20">
        <section class="glass-panel relative rounded-[32px] px-6 py-6 sm:px-9 sm:py-8" style="z-index:30">
            <div class="text-center">
                <h1 class="hero-title mt-2 font-semibold tracking-tight" style="font-size: clamp(3.4rem, 7vw, 5.4rem); line-height: 1.02; margin-bottom: 0.75rem;">
                    ShadUp with AI
                </h1>
                <p class="mt-6 text-base leading-7 text-white/88 sm:text-lg sm:leading-8">
                    AIで音声作成
                </p>
                <p class="mt-3 text-base leading-7 text-white/88 sm:text-lg sm:leading-8">
                    好きな文章でシャドーイング
                </p>
            </div>

            <div class="mx-auto mt-8 mb-5 flex max-w-lg gap-3">
                @auth
                    <a
                        href="{{ route('reading.index') }}"
                        class="flex min-h-[52px] w-full items-center justify-center whitespace-nowrap rounded-2xl bg-white px-4 py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-100"
                    >
                        学習を始める
                    </a>
                @else
                    <a
                        href="{{ route('login') }}"
                        class="flex min-h-[52px] w-full items-center justify-center whitespace-nowrap rounded-2xl bg-white px-4 py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-100"
                    >
                        Log in
                    </a>

                    @if (Route::has('register'))
                        <a
                            href="{{ route('register') }}"
                            class="flex min-h-[52px] w-full items-center justify-center whitespace-nowrap rounded-2xl border border-white/25 bg-white/12 px-4 py-4 text-base font-medium text-white transition hover:bg-white/18"
                        >
                            Register
                        </a>
                    @endif
                @endauth
            </div>
        </section>
    </main>
</body>
</html>

