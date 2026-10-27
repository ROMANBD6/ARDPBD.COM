<?php
// Backend (PHP 7.4+ ও PDO)। সব ডাটা SQL ডাটাবেজে সেভ হয়; কানেকশন সেটিংস config.php তে
$C=require __DIR__.'/config.php';
$DEV=!empty($C['dev'])&&in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)&&empty($_SERVER['HTTP_X_FORWARDED_FOR']);
$ADMIN=strtolower(trim((string)($C['admin_user']??'adminroman')));
session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS'])]);
ini_set('display_errors','0');
session_start();
header('Content-Type: application/json; charset=utf-8');
@mkdir(__DIR__.'/uploads',0755,true);
function out($v,$c=200){http_response_code($c);echo json_encode($v,JSON_UNESCAPED_UNICODE);exit;}
function dberr($e){
 $m=$e->getMessage();
 if(stripos($m,'driver')!==false)$h='the PHP extension pdo_mysql (or pdo_sqlite) is not enabled.';
 elseif(strpos($m,'1045')!==false)$h='wrong database user or password in config.php.';
 elseif(strpos($m,'2002')!==false||strpos($m,'2006')!==false)$h='cannot reach the database server. Is MySQL running? Check host in config.php.';
 else $h='check the settings in config.php.';
 out(['err'=>'Database error: '.$h],500);
}
// JSON নাম => ডাটাবেজ কলাম
$M=['banners'=>['title'=>'title','text'=>'txt','link'=>'link','img'=>'img'],
 'products'=>['name'=>'name','cat'=>'cat','price'=>'price','old'=>'oldp','desc'=>'descr','img'=>'img'],
 'blogs'=>['title'=>'title','body'=>'body','img'=>'img']];
$SK=['name','tagline','logo','favicon','phone','whatsapp','email','address','map','social','about'];
$LIM=['title'=>255,'name'=>255,'cat'=>100,'price'=>100,'oldp'=>100,'txt'=>15000,'descr'=>15000,'body'=>15000];

$my=($C['driver']??'mysql')==='mysql';
$opt=[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC];
try{
 if($my){
  $dsn='mysql:host='.$C['host'].';charset=utf8mb4';
  try{$db=new PDO($dsn.';dbname='.$C['name'],$C['user'],$C['pass'],$opt);}
  catch(PDOException $e){
   if((int)$e->getCode()!==1049&&strpos($e->getMessage(),'1049')===false)throw $e;
   $n=str_replace('`','',$C['name']);
   $db=new PDO($dsn,$C['user'],$C['pass'],$opt);
   $db->exec("CREATE DATABASE IF NOT EXISTS `$n` CHARACTER SET utf8mb4");
   $db->exec("USE `$n`");
  }
 }else{
  @mkdir(dirname($C['sqlite']),0755,true);
  $db=new PDO('sqlite:'.$C['sqlite'],null,null,$opt);
 }
 $tail=$my?' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4':'';
 foreach([
  'settings(k VARCHAR(40) PRIMARY KEY,v TEXT)',
  'meta(k VARCHAR(40) PRIMARY KEY,v TEXT)',
  'banners(id VARCHAR(40) PRIMARY KEY,pos INT,title VARCHAR(255),txt TEXT,link VARCHAR(500),img VARCHAR(500))',
  'products(id VARCHAR(40) PRIMARY KEY,pos INT,name VARCHAR(255),cat VARCHAR(100),price VARCHAR(100),oldp VARCHAR(100),img VARCHAR(500),descr TEXT)',
  'blogs(id VARCHAR(40) PRIMARY KEY,pos INT,title VARCHAR(255),body TEXT,img VARCHAR(500))',
  'users(email VARCHAR(190) PRIMARY KEY,name VARCHAR(60),pw VARCHAR(255),created VARCHAR(20),phone VARCHAR(20))',
  'orders(id VARCHAR(24) PRIMARY KEY,created VARCHAR(20),email VARCHAR(190),name VARCHAR(60),phone VARCHAR(20),addr TEXT,note TEXT,items TEXT,total INT,status VARCHAR(20))',
  'pending(email VARCHAR(190) PRIMARY KEY,name VARCHAR(60),phone VARCHAR(20),pw VARCHAR(255),ec VARCHAR(64),sc VARCHAR(64),expires INT,tries INT,sent INT,nsent INT,ip VARCHAR(45))'
 ] as $s)$db->exec('CREATE TABLE IF NOT EXISTS '.$s.$tail);
 if(!$db->query("SELECT 1 FROM meta WHERE k='v2'")->fetch()){
  try{$db->exec('ALTER TABLE users ADD COLUMN phone VARCHAR(20)');}catch(Throwable $e){}
  $db->exec("INSERT INTO meta(k,v) VALUES('v2','1')");
 }
}catch(Throwable $e){dberr($e);}

function q($s,$p=[]){global $db;$st=$db->prepare($s);$st->execute($p);return $st;}
function rows($t){
 global $M;$o=[];
 foreach(q("SELECT * FROM $t ORDER BY pos")->fetchAll() as $r){$x=['id'=>$r['id']];foreach($M[$t] as $j=>$c)$x[$j]=(string)$r[$c];$o[]=$x;}
 return $o;
}
// পুরো তালিকা একসাথে সেভ (ট্রানজেকশনে): পুরনো সারি মুছে নতুনগুলো বসে
function put($t,$items){
 global $db,$M,$LIM;
 $db->beginTransaction();
 try{
  q("DELETE FROM $t");$seen=[];
  foreach(array_values($items) as $i=>$it){
   if(!is_array($it))continue;
   $id=substr(preg_replace('/[^\w-]/','',(string)($it['id']??'')),0,40);
   if($id===''||isset($seen[$id]))$id=bin2hex(random_bytes(5));
   $seen[$id]=1;$cols=['id','pos'];$vals=[$id,$i];
   foreach($M[$t] as $j=>$c){$cols[]=$c;$vals[]=mb_substr((string)($it[$j]??''),0,$LIM[$c]??500);}
   q("INSERT INTO $t(".implode(',',$cols).") VALUES(".implode(',',array_fill(0,count($cols),'?')).")",$vals);
  }
  $db->commit();
 }catch(Throwable $e){$db->rollBack();throw $e;}
}
function putS($v){
 global $db,$SK;
 $db->beginTransaction();
 try{
  q('DELETE FROM settings');
  foreach($SK as $k)q('INSERT INTO settings(k,v) VALUES(?,?)',[$k,mb_substr((string)($v[$k]??''),0,15000)]);
  $db->commit();
 }catch(Throwable $e){$db->rollBack();throw $e;}
}

function ph($s){$d=preg_replace('/\D/','',(string)$s);if(preg_match('/^01[3-9]\d{8}$/',$d))$d='880'.substr($d,1);return preg_match('/^8801[3-9]\d{8}$/',$d)?$d:'';}
function http($u){
 if(function_exists('curl_init')){$c=curl_init($u);curl_setopt_array($c,[CURLOPT_RETURNTRANSFER=>1,CURLOPT_TIMEOUT=>10]);$r=curl_exec($c);curl_close($c);return $r!==false;}
 return @file_get_contents($u,false,stream_context_create(['http'=>['timeout'=>10]]))!==false;
}
// ইমেইল ও SMS এ আলাদা ৬ ডিজিটের কোড পাঠায় (কোড ১০ মিনিট চলে)
function sendcodes($em){
 global $C,$DEV;
 $r=q('SELECT * FROM pending WHERE email=?',[$em])->fetch();
 if(!$r)out(['err'=>'Please start the signup again.'],400);
 if((int)$r['nsent']>0&&time()-(int)$r['sent']<60)out(['err'=>'Please wait a minute before asking for new codes.'],429);
 if((int)$r['nsent']>=5)out(['err'=>'Too many codes requested. Please try again later.'],429);
 $ec=(string)random_int(100000,999999);$sc=(string)random_int(100000,999999);
 q('UPDATE pending SET ec=?,sc=?,expires=?,tries=0,sent=?,nsent=nsent+1 WHERE email=?',[hash('sha256',$ec.$em),hash('sha256',$sc.$em),time()+600,time(),$em]);
 if($DEV)out(['ok'=>1,'step'=>'verify','dev'=>['email'=>$ec,'sms'=>$sc]]);
 $nm=q("SELECT v FROM settings WHERE k='name'")->fetch();$nm=$nm?$nm['v']:'Our shop';
 $m1=@mail($em,'Your verification code',"$ec is your email verification code for $nm. It expires in 10 minutes.",'From: '.($C['mail_from']??'no-reply@localhost')."\r\nContent-Type: text/plain; charset=UTF-8");
 $url=(string)($C['sms_url']??'');
 $m2=$url!==''&&http(str_replace(['{to}','{msg}'],[urlencode($r['phone']),urlencode("$sc is your $nm verification code.")],$url));
 if(!$m1||!$m2)out(['err'=>'Could not send the code by '.(!$m1&&!$m2?'email and SMS':(!$m1?'email':'SMS')).'. Check the mail and SMS settings in config.php.'],500);
 out(['ok'=>1,'step'=>'verify']);
}
// প্রথমবার চালালে: আগের ফাইল-ভিত্তিক ডাটা (data/db.php, users.php, admin.php) থাকলে ইমপোর্ট, না থাকলে স্যাম্পল কনটেন্ট
try{
 if(!(int)q('SELECT COUNT(*) c FROM settings')->fetch()['c']){
  $ld=function($f){$s=@file_get_contents(__DIR__.'/data/'.$f);$v=$s?json_decode(substr($s,14),true):null;return is_array($v)?$v:null;};
  $P=[['Vinyl Banner','Banner','Weather-resistant vinyl for shopfronts and events.'],['PVC Flex Banner','Banner','Large-format flex for hoardings and signboards.'],['Event Poster','Poster','Sharp colour posters from A4 to A0.'],['Leaflet and Flyer','Leaflet','Single and double-sided leaflets in any quantity.'],['Sticker and Label','Sticker','Cut-to-shape stickers and product labels.'],['Packaging Box','Packaging','Custom printed boxes for retail and delivery.']];
  $S=$ld('db.php')?:[
   'settings'=>['name'=>'Ashikur Rahman Digital Printing & Packaging','tagline'=>'Banners, posters, leaflets and packaging, printed sharp and delivered on time.','logo'=>'uploads/logo.jpg','favicon'=>'uploads/logo.jpg','phone'=>'','whatsapp'=>'','email'=>'','address'=>'','map'=>'','social'=>'[]','about'=>'Ashikur Rahman Digital Printing & Packaging prints banners, posters, leaflets, stickers and packaging boxes to order. Tell us the size, quantity and design you need, and we will take care of the rest.'],
   'banners'=>[['id'=>'b1','img'=>'','title'=>'Banners, posters and leaflets, printed sharp','text'=>'Vinyl, flex and offset printing with fast turnaround for shops, events and brands.','link'=>'#products'],['id'=>'b2','img'=>'','title'=>'Packaging that sells your product','text'=>'Custom boxes, labels and stickers made to your size and design.','link'=>'#contact']],
   'products'=>array_map(function($r,$i){return['id'=>"p$i",'name'=>$r[0],'cat'=>$r[1],'price'=>'','old'=>'','img'=>'','desc'=>$r[2]];},$P,array_keys($P)),
   'blogs'=>[['id'=>'g1','title'=>'How to choose the right banner material','img'=>'','body'=>"Vinyl suits short events and indoor use. PVC flex lasts longer outdoors and handles wind better.\n\nTell us where the banner will hang and for how long, and we will suggest the right material and size."]]
  ];
  putS($S['settings']??[]);
  foreach(['banners','products','blogs'] as $t)put($t,$S[$t]??[]);
  foreach($ld('users.php')?:[] as $u){
   try{q('INSERT INTO users(email,name,pw,created) VALUES(?,?,?,?)',[$u['email'],$u['name'],$u['hash'],$u['date']??'']);}catch(Throwable $e){}
  }
  $h=$ld('admin.php')['hash']??null;
  if($h)q('INSERT INTO meta(k,v) VALUES(?,?)',['admin_hash',$h]);
 }
}catch(Throwable $e){dberr($e);}

$in=json_decode(file_get_contents('php://input'),true)?:[];$a=$_GET['a']??'';$me=$_SESSION['u']??null;$adm=$me&&$me['role']==='admin';
if($_SERVER['REQUEST_METHOD']==='POST'&&stripos($_SERVER['CONTENT_TYPE']??'','application/json')===false)out(['err'=>'Bad request'],400);

try{
 if($a==='data'){
  $s=[];foreach(q('SELECT k,v FROM settings')->fetchAll() as $r)$s[$r['k']]=$r['v'];
  foreach($SK as $k)$s[$k]=$s[$k]??'';
  out(['settings'=>$s,'banners'=>rows('banners'),'products'=>rows('products'),'blogs'=>rows('blogs'),'me'=>$me?['name'=>$me['name'],'role'=>$me['role']]:null]);
 }
 if($a==='logout'){session_destroy();out(['ok'=>1]);}
 if($a==='signup'){
  $n=mb_substr(trim($in['name']??''),0,60);$em=strtolower(trim($in['email']??''));$ph=ph($in['phone']??'');$p=(string)($in['pass']??'');
  if($n===''||strlen($em)>190||!filter_var($em,FILTER_VALIDATE_EMAIL))out(['err'=>'Enter your name and a valid email address.'],400);
  $dom=substr(strrchr($em,'@'),1);
  if(!$DEV&&function_exists('checkdnsrr')&&!@checkdnsrr($dom,'MX')&&!@checkdnsrr($dom,'A'))out(['err'=>'This email domain does not exist. Please use a real email address.'],400);
  if($ph==='')out(['err'=>'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).'],400);
  if(strlen($p)<6)out(['err'=>'Password must be 6 or more characters.'],400);
  if(q('SELECT 1 FROM users WHERE email=? OR phone=?',[$em,$ph])->fetch())out(['err'=>'This email or mobile number is already registered.'],400);
  $ip=$_SERVER['REMOTE_ADDR']??'';
  q('DELETE FROM pending WHERE sent<?',[time()-86400]);
  if((int)q('SELECT COUNT(*) c FROM pending WHERE ip=? AND sent>?',[$ip,time()-3600])->fetch()['c']>=10)out(['err'=>'Too many attempts. Please try again later.'],429);
  q('DELETE FROM pending WHERE email=?',[$em]);
  q('INSERT INTO pending(email,name,phone,pw,ec,sc,expires,tries,sent,nsent,ip) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[$em,$n,$ph,password_hash($p,PASSWORD_DEFAULT),'','',0,0,0,0,$ip]);
  sendcodes($em);
 }
 if($a==='resend')sendcodes(strtolower(trim($in['email']??'')));
 if($a==='verify'){
  $em=strtolower(trim($in['email']??''));
  $r=q('SELECT * FROM pending WHERE email=?',[$em])->fetch();
  if(!$r||(int)$r['nsent']<1||time()>(int)$r['expires'])out(['err'=>'Codes expired. Please sign up again.'],400);
  if((int)$r['tries']>=5)out(['err'=>'Too many wrong tries. Please sign up again.'],429);
  $e1=hash_equals((string)$r['ec'],hash('sha256',trim((string)($in['ecode']??'')).$em));
  $e2=hash_equals((string)$r['sc'],hash('sha256',trim((string)($in['scode']??'')).$em));
  if(!$e1||!$e2){q('UPDATE pending SET tries=tries+1 WHERE email=?',[$em]);out(['err'=>'Wrong code. Please check both the email code and the SMS code.'],400);}
  q('INSERT INTO users(email,name,phone,pw,created) VALUES(?,?,?,?,?)',[$em,$r['name'],$r['phone'],$r['pw'],date('Y-m-d')]);
  q('DELETE FROM pending WHERE email=?',[$em]);
  session_regenerate_id(true);$_SESSION['u']=['name'=>$r['name'],'email'=>$em,'role'=>'user'];out(['ok'=>1]);
 }
 if($a==='login'){
  $id=strtolower(trim($in['id']??''));$p=(string)($in['pass']??'');
  $h=q('SELECT v FROM meta WHERE k=?',['admin_hash'])->fetch();$hv=$h?$h['v']:'';
  if($hv===''&&(string)($C['admin_pass']??'')!==''){$hv=password_hash((string)$C['admin_pass'],PASSWORD_DEFAULT);q('INSERT INTO meta(k,v) VALUES(?,?)',['admin_hash',$hv]);}
  if($id===$ADMIN&&$hv==='')out(['err'=>'Admin password is not set. Add admin_pass in config.php.'],500);
  if($id===$ADMIN&&password_verify($p,$hv)){session_regenerate_id(true);$_SESSION['u']=['name'=>'Admin','role'=>'admin'];out(['ok'=>1]);}
  $u=q('SELECT * FROM users WHERE email=? OR phone=?',[$id,ph($id)?:'-'])->fetch();
  if($u&&password_verify($p,$u['pw'])){session_regenerate_id(true);$_SESSION['u']=['name'=>$u['name'],'email'=>$u['email'],'role'=>'user'];out(['ok'=>1]);}
  usleep(700000);out(['err'=>'Wrong ID or password.'],401);
 }
 if($a==='order'){
  if(!$me||$me['role']!=='user')out(['err'=>'Please login to place an order.'],401);
  $ad=trim((string)($in['addr']??''));
  if(mb_strlen($ad)<5)out(['err'=>'Please enter your delivery address.'],400);
  $its=[];$tot=0;$tbd=false;
  foreach(array_slice((array)($in['items']??[]),0,50) as $it){
   if(!is_array($it))continue;
   $p=q('SELECT * FROM products WHERE id=?',[(string)($it['id']??'')])->fetch();
   if(!$p)continue;
   $n=max(1,min(999,(int)($it['q']??1)));
   $pr=(float)preg_replace('/[^\d.]/','',strtr((string)$p['price'],['০'=>'0','১'=>'1','২'=>'2','৩'=>'3','৪'=>'4','৫'=>'5','৬'=>'6','৭'=>'7','৮'=>'8','৯'=>'9']));
   if($pr>0)$tot+=$pr*$n;else $tbd=true;
   $its[]=['id'=>$p['id'],'name'=>$p['name'],'price'=>$p['price'],'q'=>$n];
  }
  if(!$its)out(['err'=>'Your cart is empty.'],400);
  $u=q('SELECT phone FROM users WHERE email=?',[$me['email']])->fetch();
  $id='AR'.date('ymd').'-'.random_int(1000,9999);$total=$tbd?0:(int)round($tot);
  q('INSERT INTO orders(id,created,email,name,phone,addr,note,items,total,status) VALUES(?,?,?,?,?,?,?,?,?,?)',[$id,date('Y-m-d H:i'),$me['email'],$me['name'],(string)($u['phone']??''),mb_substr($ad,0,500),mb_substr((string)($in['note']??''),0,2000),json_encode($its,JSON_UNESCAPED_UNICODE),$total,'New']);
  out(['ok'=>1,'id'=>$id,'total'=>$total]);
 }
 // এখান থেকে নিচে শুধু অ্যাডমিন
 if(!$adm)out(['err'=>'Admin only.'],403);
 if($a==='save'){
  $k=$in['key']??'';$v=$in['val']??null;
  if(!is_array($v)||!in_array($k,['settings','banners','products','blogs'],true))out(['err'=>'Bad data'],400);
  if($k==='settings')putS($v);else put($k,$v);
  out(['ok'=>1]);
 }
 if($a==='upload'){
  $s=(string)($in['img']??'');
  if(!preg_match('#^data:image/(jpeg|png|webp|gif);base64,#',$s,$m))out(['err'=>'Images only (JPG, PNG, WebP, GIF).'],400);
  $b=base64_decode(substr($s,strlen($m[0])),true);
  if(!$b||strlen($b)>4000000||!@getimagesizefromstring($b))out(['err'=>'Bad or too large image.'],400);
  $f='uploads/'.bin2hex(random_bytes(6)).'.'.($m[1]==='jpeg'?'jpg':$m[1]);file_put_contents(__DIR__.'/'.$f,$b);out(['url'=>$f]);
 }
 if($a==='users')out(array_map(function($u){return['name'=>$u['name'],'email'=>$u['email'],'phone'=>(string)$u['phone'],'date'=>$u['created']];},q('SELECT name,email,phone,created FROM users ORDER BY created DESC')->fetchAll()));
 if($a==='orders')out(array_map(function($r){$r['items']=json_decode($r['items'],true)?:[];$r['total']=(int)$r['total'];return $r;},q('SELECT * FROM orders ORDER BY created DESC')->fetchAll()));
 if($a==='ostatus'){
  $s=(string)($in['status']??'');
  if(!in_array($s,['New','Confirmed','Printing','Ready','Delivered','Cancelled'],true))out(['err'=>'Bad status'],400);
  q('UPDATE orders SET status=? WHERE id=?',[$s,(string)($in['id']??'')]);out(['ok'=>1]);
 }
 if($a==='pass'){
  $p=(string)($in['pass']??'');
  if(strlen($p)<8)out(['err'=>'Use 8 or more characters.'],400);
  q('DELETE FROM meta WHERE k=?',['admin_hash']);
  q('INSERT INTO meta(k,v) VALUES(?,?)',['admin_hash',password_hash($p,PASSWORD_DEFAULT)]);out(['ok'=>1]);
 }
}catch(Throwable $e){dberr($e);}
out(['err'=>'Unknown action.'],404);
