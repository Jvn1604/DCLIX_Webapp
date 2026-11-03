<?php
/**
 * Minimal PHP (7.1+, needs the curl extension) client for the D-clix website API.
 * Copy this one file into the d-clix.com PHP code. Call it from SERVER-SIDE PHP only:
 * the secret must never reach the browser, JavaScript or a public repository.
 *
 *   $api = new DclixApi('https://demo.maclubsystem.com', 'CLIENT_ID', 'CLIENT_SECRET');   // keep these in config / env
 *   $api->ping();
 *   $plans = $api->packages(array('sportid' => 1));
 *   $res = $api->register($fields, bin2hex(random_bytes(16)));   // new idempotency key per form submission
 *
 * Every method returns the `data` part of the response, or throws DclixApiException
 * (->status http code, ->errorCode e.g. 'validation_failed', ->details field errors, ->data, ->requestId).
 */
class DclixApiException extends Exception
{
	public $status = 0;
	public $errorCode = '';
	public $details = null;
	public $data = null;        // set for 409 registration_in_progress (the order that is still waiting for payment)
	public $requestId = '';
}

class DclixApi
{
	const PREFIX = '/api/website/v1';

	private $base;
	private $clientId;
	private $secret;
	private $caFile;

	/** $base: portal address only, e.g. https://demo.maclubsystem.com (staging) or https://maclubsystem.com (production). */
	public function __construct($base, $clientId, $secret, $caFile = '')
	{
		$this->caFile   = $caFile;
		$this->base     = rtrim($base, '/');
		$this->clientId = $clientId;
		$this->secret   = $secret;
	}

	// ------------------------------------------------------------------ endpoints

	public function ping()                       { return $this->call('GET', '/ping'); }
	public function packages($query = array())   { return $this->call('GET', '/packages', $query); }          // sportid optional
	public function content()                    { return $this->call('GET', '/content'); }
	public function sendEnquiry($fields)         { return $this->call('POST', '/enquiry', array(), $fields); }
	public function registrationOptions()        { return $this->call('GET', '/registration/options'); }      // paymentRequired true/false
	public function quote($query)                { return $this->call('GET', '/registration/quote', $query); } // planCode, sportId, promoCode
	public function check($query)                { return $this->call('GET', '/registration/check', $query); } // clubCode, clubName, email
	/** Redirect the visitor's browser to $result['payment']['url'] when it is present (payment on). */
	public function register($fields, $idempotencyKey = '') { return $this->call('POST', '/registration', array(), $fields, $idempotencyKey); }
	public function registrationStatus($reference) { return $this->call('GET', '/registration/status/' . rawurlencode($reference)); }

	// ------------------------------------------------------------------ signing

	private static function canonicalQuery($query)
	{
		$pairs = array();
		foreach ((array)$query as $k => $v)
		{
			if ($v === null || $v === '') { continue; }
			$pairs[] = array(rawurlencode((string)$k), rawurlencode((string)$v));
		}
		usort($pairs, function ($a, $b) {
			$c = strcmp($a[0], $b[0]);
			return $c !== 0 ? $c : strcmp($a[1], $b[1]);
		});
		$out = array();
		foreach ($pairs as $p) { $out[] = $p[0] . '=' . $p[1]; }
		return implode('&', $out);
	}

	/** Signature headers for one request. Public so it can be unit-tested. */
	public function signature($method, $path, $queryString, $timestamp, $nonce, $rawBody)
	{
		$canonical = strtoupper($method) . "\n" . $path . "\n" . $queryString . "\n" . $timestamp . "\n" . $nonce . "\n" . hash('sha256', $rawBody);
		return hash_hmac('sha256', $canonical, $this->secret);
	}

	private function call($method, $path, $query = array(), $body = null, $idempotencyKey = '')
	{
		$fullPath = self::PREFIX . $path;
		$qs       = self::canonicalQuery($query);
		$raw      = $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		$ts       = (string)time();
		$nonce    = bin2hex(random_bytes(16));

		$headers = array(
			'X-Client-Id: ' . $this->clientId, 'X-Timestamp: ' . $ts, 'X-Nonce: ' . $nonce,
			'X-Signature: ' . $this->signature($method, $fullPath, $qs, $ts, $nonce, $raw), 'Accept: application/json',
		);
		if ($raw !== '') { $headers[] = 'Content-Type: application/json'; }
		if ($idempotencyKey !== '') { $headers[] = 'Idempotency-Key: ' . $idempotencyKey; }

		$ch = curl_init($this->base . $fullPath . ($qs !== '' ? '?' . $qs : ''));
		curl_setopt_array($ch, array(
			CURLOPT_CUSTOMREQUEST => strtoupper($method), CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 30, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
		));
		if ($raw !== '') { curl_setopt($ch, CURLOPT_POSTFIELDS, $raw); }
		if ($this->caFile !== '') { curl_setopt($ch, CURLOPT_CAINFO, $this->caFile); }   // own CA bundle (old xampp)
		$response = curl_exec($ch);
		$status   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$curlErr  = curl_error($ch);
		curl_close($ch);

		if ($response === false)
		{
			$e = new DclixApiException('Could not reach the portal: ' . $curlErr);
			$e->errorCode = 'network_error';
			throw $e;
		}
		$json = json_decode($response, true);
		if ($status < 200 || $status >= 300 || !is_array($json) || empty($json['ok']))
		{
			$e = new DclixApiException(isset($json['error']['message']) ? $json['error']['message'] : 'HTTP ' . $status);
			$e->status    = $status;
			$e->errorCode = isset($json['error']['code']) ? $json['error']['code'] : '';
			$e->details   = isset($json['error']['details']) ? $json['error']['details'] : null;
			$e->data      = isset($json['data']) ? $json['data'] : null;
			$e->requestId = isset($json['requestId']) ? $json['requestId'] : '';
			throw $e;
		}
		return $json['data'];
	}
}
