/* *******************************************************************
 * URI-Template :RFC6570 Implementations
 *   Version: 0.1
 *   http://tools.ietf.org/html/rfc6570
 *   (C) makoto@2ch.to
 * ******************************************************************* */
var URI_Template	= function(){
	"use strict";
	/* ***************************************************************
	 * type
	 * *************************************************************** */
	var type	= function($var){
		var $type = typeof $var;
		return $type === 'undefined'
			? $type
			: $var === null
				? 'null'
				: $type === 'object'
					? $var instanceof Array ? 'array': $type
					: $type
		;
	}
	/* ***************************************************************
	 * string
	 *	 attention: function equal undefined
	 * *************************************************************** */
	var toString	= function($var){
		var undefined;
		var $type	= type($var);
		switch($type){
			case 'boolean'	: return $var ? 'true' : 'false';
			case 'number'	: return String($var);
			case 'string'	: return String($var);
			case 'object'	: return $var;
			case 'null'		: return '';
			case 'array'	: return $var;
			case 'undefined': return undefined;
			case 'function' : return undefined;
		}
		return '';
	}
	/* ***************************************************************
	 * clone
	 * *************************************************************** */
	var clone	= function($old){
		var undefined;
		var $type	= type($old);
		if( $type === 'object' ){
			var $tmp	= {};
			for( var $key in $old ){
				var $t		= type($old[$key]);
				var $value	= $old[$key];
				if( $t === 'object' ) $value = clone($value);
				$tmp[$key] = $value;
			}
			return $tmp;
		}else if( $type === 'array' ){
			return [].concat($old);
		}
		return $old;
	}
	/* ***************************************************************
	 * parse in tag
	 * *************************************************************** */
	var parser1	= function($option,$value,$top){
		if( typeof $top === 'undefined' ) $top = window;
		var $_		= $value.split(',');
		var $loop	= $_.length;
		var $R		= [];
		for( var $i = 0 ; $i<$loop ;$i++ ){
			var $name		= $_[$i];
			var $explode	= false;
			var $length		= 0;
			/* *******************************************************
			 * parse modifier
			 * ******************************************************* */
			if( $name.match(/(.+)\*$/) ){
				$name	= RegExp.$1;
				$explode	= true;
			}else if( $name.match(/(.+):(\d+)$/) ){
				$name	= RegExp.$1;
				$length	= RegExp.$2;
			}
			/* *******************************************************
			 * Get variable
			 * ******************************************************* */
			if( !($name in $top) ) continue;
			var $value	= toString( $top[$name] );
			var $type	= type($value);
			if( $type === 'undefined' ) continue;
			/* *******************************************************
			 * explodeじゃないオブジェクトはarrayと一緒
			 * ******************************************************* */
			if( !$explode && $type === 'object'){
				var $tmp	= [];
				for( var $index in $value ){
					$tmp.push($index);
					$tmp.push($value[$index]);
				}
				$value	= $tmp;
				$type	= 'array';
			}
			/* *******************************************************
			 * lengthの指定が有る場合
			 * ******************************************************* */
			if($length && $type === 'string') $value = $value.substr(0,$length);
			/* *******************************************************
			 * 返り値の準備
			 * ******************************************************* */
			$R.push({
				name		: $name,
				length		: $length,
				explode		: $explode,
				value		: $value,
				type		: $type,
			});
		}
		return $R;
	};
	/* ***************************************************************
	 * explode object,array
	 * *************************************************************** */
	var parser2	= function($option,$_){
		var $R		= [];
		var $loop	= $_.length;
		for( var $i = 0 ;$i<$loop;$i++){
			var $cur	= $_[$i];
			if( !($cur.type === 'object' || $cur.type === 'array') ){
				$R.push($cur);
				continue;
			}
			if( $cur.explode ){
				var $tmp	= [];
				for( var $index in $cur.value ){
					var $new	= clone($cur);
					if( $cur.type === 'object' ){
						$new.value	= {};
						$new.value[$index] = $cur.value[$index];
					}else if( $cur.type === 'array' ){
						$new.type	= 'string';
						$new.value	= $cur.value[$index];
					}
					$tmp.push($new);
				}
				var $tmp_i	= $tmp.length;
				for(var $ii=0;$ii<$tmp_i;$ii++){
					$R.push($tmp[$ii]);
				}
			}else{
				$R.push($_[$i]);
				continue;
			}
		}
		return $R;
	};
	/* ***************************************************************
	 * Encoding
	 * *************************************************************** */
	var encoding	= function($option,$cur){
		switch($option.allow){
			/* ***************************************************
			 * U
			 * *************************************************** */
			case 'U':
				switch($cur.type){
					case 'string':
						$cur.value	= encodeURIComponent($cur.value);
					break;
					case 'array':
						var $tmp	= [];
						for( var $name in $cur.value ){
							$tmp.push( encodeURIComponent($cur.value[$name]) );
						}
						$cur.value	= $tmp.join(',');
					break;
					case 'object':
						var $tmp	= [];
						for( var $name in $cur.value ){
							$tmp.push( $name + '=' + encodeURIComponent($cur.value[$name]) );
						}
						$cur.value	= $tmp.join(',');
					break;
					default:
						$cur.value	= '';
						$cur.type	= 'string';
					break;
				}
			break;
			/* ***************************************************
			 * U+R
			 * *************************************************** */
			case 'U+R':
				switch($cur.type){
					case 'string':
						$cur.value	= encodeURI($cur.value);
					break;
					case 'array':
						var $tmp	= [];
						for( var $name in $cur.value ){
							$tmp.push( encodeURI($cur.value[$name]) );
						}
						$cur.value	= $tmp.join(',');
					break;
					case 'object':
						var $tmp	= [];
						for( var $name in $cur.value ){
							$tmp.push( $name + '=' + encodeURI($cur.value[$name]) );
						}
						$cur.value	= $tmp.join(',');
					break;
					default:
						$cur.value	= '';
						$cur.type	= 'string';
					break;
				}
			break;
		}
		return $cur;
	}
	/* ***************************************************************
	 * Encoding
	 * *************************************************************** */
	var parser3	= function($option,$_){
		for( var $i in $_){
			$_[$i]	= encoding($option,$_[$i]);
		}
		return $_;
	};
	/* ***************************************************************
	 * パース
	 * *************************************************************** */
	var parser	= function($option,$value,$top){
		var $_;
		$_		= parser1($option,$value,$top);	//variable 
		$_		= parser2($option,$_);		//explode
		$_		= parser3($option,$_);		//encode
		return $_;
	};
	/* ***************************************************************
	 * 文字列に変換してopに合わせて結合する
	 * *************************************************************** */
	var createValue	= function($option,$parsed){
		var $values	= [];
		for( var $i in $parsed ){
			var $cur	= $parsed[$i];
			var $value = createString($option,$cur);
			$values.push( $value );
		}
		return $values.join($option.sep);
	};
	/* ***************************************************************
	 * string,object*,array*のいづれか
	 * *************************************************************** */
	var createString	= function($option,$_){
		switch($_.type){
			case 'string':
				return $option.named
					? $_.name + '=' + $_.value
					: $_.value
				;
			case 'object':
				return $_.value;
			case 'array':
				return $option.named
					? $_.name + '=' + $_.value
					: $_.value
				;
		}
		return '';
	};
	/* ***************************************************************
	 * URI-Templateの変数部分の正規表現
	 * ****************************
	 *********************************** */
	var $expr	= new RegExp(/(\{([+#.\/;\?&=,!@|])?(.+?)\})/);
	/* ***************************************************************
	 * URI-Templateの変数部分の正規表現
	 * *************************************************************** */
	return {
		/* ***************************************************************
		 * op毎のデフォルト値
		 * *************************************************************** */
		option	: {
			''	: {op:'' ,first:'' ,sep:',',named:false,ifemp:'' ,allow:'U'  },
			'+'	: {op:'+',first:'' ,sep:',',named:false,ifemp:'' ,allow:'U+R'},
			'.'	: {op:'.',first:'.',sep:'.',named:false,ifemp:'' ,allow:'U'  },
			'/'	: {op:'/',first:'/',sep:'/',named:false,ifemp:'' ,allow:'U'  },
			';'	: {op:';',first:';',sep:';',named:true ,ifemp:'' ,allow:'U'  },
			'?'	: {op:'?',first:'?',sep:'&',named:true ,ifemp:'=',allow:'U'  },
			'&'	: {op:'&',first:'&',sep:'&',named:true ,ifemp:'=',allow:'U'  },
			'#'	: {op:'#',first:'#',sep:',',named:false,ifemp:'' ,allow:'U+R'}
		},
		/* ***************************************************************
		 * $URI_Template.parse($uri[,object] );
		 * *************************************************************** */
		parse	: function($uri,$top){
			/* ***********************************************************
			 * parse $uri
			 * *********************************************************** */
			while( $expr.exec($uri) !== null ){
				var $target		= RegExp.$1;
				var $option		= RegExp.$2;
				$option = ($option in this.option) ? this.option[$option] : this.option[''];
				var $parsed		= parser($option,RegExp.$3,$top);
				var $value		= $option.first + createValue($option,$parsed);
				do{ $uri = $uri.replace($target,$value); } while( $uri.indexOf($target) !== -1 );
			}
			return $uri;
		}
	};
}();
