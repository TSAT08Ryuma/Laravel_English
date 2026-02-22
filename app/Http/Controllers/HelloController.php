<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HelloController extends Controller
{
    public function index()
    {
        // 🔽 1. Viewに渡すためのデータを用意
        $message = "これはコントローラから渡されたメッセージです。";
        $description = "このように、Controllerで処理した結果やデータベースから取得した値をViewに渡すことができます。";

        // 🔽 2. compact() を使ってデータをビューに渡す
        return view('hello.index', compact('message', 'description'));
    }
}