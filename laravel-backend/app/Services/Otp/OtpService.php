<?php

namespace App\Services\Otp;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

interface OtpDriverInterface
{
    public function sendOtp(string $identifier, string $rawCode, string $sessionToken): bool;
}

class BaleBotOtpDriver implements OtpDriverInterface
{
    public function sendOtp(string $identifier, string $rawCode, string $sessionToken): bool
    {
        $token = config('services.bale.bot_token');
        $response = Http::timeout(8)->post("https://tapi.bale.ai/bot{$token}/sendMessage", [
            'chat_id' => $identifier,
            'text' => "🌿 کد ورود یک‌بارمصرف شما به کافه گل:\n\n*{$rawCode}*\n\nاین کد تا ۲ دقیقه معتبر است.",
            'parse_mode' => 'Markdown',
        ]);
        return $response->successful();
    }
}

class TelegramBotOtpDriver implements OtpDriverInterface
{
    public function sendOtp(string $identifier, string $rawCode, string $sessionToken): bool
    {
        $token = config('services.telegram.bot_token');
        $baseUrl = rtrim(config('services.telegram.api_base_url', 'https://api.telegram.org/bot'), '/');
        $proxy = config('services.telegram.outbound_proxy');

        $client = Http::timeout(10);
        if (!empty($proxy)) {
            $client = $client->withOptions(['proxy' => $proxy]);
        }

        $response = $client->post("{$baseUrl}{$token}/sendMessage", [
            'chat_id' => $identifier,
            'text' => "🌿 کد تأیید ورود به کافه گل: {$rawCode}\nاعتبار: ۲ دقیقه",
        ]);
        return $response->successful();
    }
}

class EmailOtpDriver implements OtpDriverInterface
{
    public function sendOtp(string $identifier, string $rawCode, string $sessionToken): bool
    {
        Mail::raw(
            "کد ورود یک‌بارمصرف شما به سامانه کافه گل: {$rawCode} (معتبر تا ۲ دقیقه)",
            function ($message) use ($identifier) {
                $message->to($identifier)->subject('کد تأیید ورود به کافه گل');
            }
        );
        return true;
    }
}

class OtpService
{
    /**
     * Issue a hashed 6-digit OTP expiring in 2 minutes with 5 max attempts.
     */
    public function issueChallenge(string $identifier, string $channel, string $ipAddress): array
    {
        $rawCode = (string) random_int(100000, 999999);
        $sessionToken = Str::random(48);

        DB::table('otp_challenges')->insert([
            'identifier' => $identifier,
            'channel' => $channel,
            'code_hash' => Hash::make($rawCode),
            'bot_session_token' => $sessionToken,
            'attempts' => 0,
            'max_attempts' => 5,
            'ip_address' => $ipAddress,
            'expires_at' => Carbon::now()->addMinutes(2),
            'created_at' => Carbon::now(),
        ]);

        return [
            'raw_code' => $rawCode,
            'session_token' => $sessionToken,
        ];
    }

    /**
     * Verify OTP code with strict attempt limiting and expiration checks.
     */
    public function verifyCode(string $identifier, string $channel, string $inputCode): bool
    {
        $challenge = DB::table('otp_challenges')
            ->where('identifier', $identifier)
            ->where('channel', $channel)
            ->whereNull('verified_at')
            ->where('expires_at', '>', Carbon::now())
            ->orderByDesc('id')
            ->first();

        if (!$challenge || $challenge->attempts >= $challenge->max_attempts) {
            return false;
        }

        DB::table('otp_challenges')
            ->where('id', $challenge->id)
            ->increment('attempts');

        if (!Hash::check($inputCode, $challenge->code_hash)) {
            return false;
        }

        DB::table('otp_challenges')
            ->where('id', $challenge->id)
            ->update(['verified_at' => Carbon::now()]);

        return true;
    }
}
