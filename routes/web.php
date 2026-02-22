<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReadingController;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/reading', [ReadingController::class, 'index'])->name('reading.index');
    Route::post('/reading/analyze', [ReadingController::class, 'analyze'])->name('reading.analyze');
    Route::post('/reading', [ReadingController::class, 'store'])->name('reading.store');
    Route::delete('/reading/{reading}', [ReadingController::class, 'destroy'])->name('reading.destroy');
});

require __DIR__.'/auth.php';
