header = terms:term* ignored* { return terms; }

term = ignored* s:struct { return s; }

ignored = macro / _
macro = "#" (!newline .)+ { return; }

struct = "struct" _+ name:name _* "{" 
	terms:struct_term* _*
	"};"
{ return {
    typename: name,
    // merge list of lists into one list (one level deep)
    members: [].concat.apply([], terms) 
  }
}

struct_term = _* 
	first:struct_first_member
    more:("," _* m:struct_member { return m; })*
    ";" _*
{ 
  for (let e of more) {
  	e.typename = first.typename;
  }
  return [first].concat(more);
}

struct_memberlist = f:struct_member r:("," _* m:struct_member { return m; })* {
	return [f].concat(r);
}

struct_first_member = 
    typename:typename _+ 
    m:struct_member
{ 
  m.typename = typename; 
  return m; 
}

struct_member = 
    pointer_levels:pointer_levels? _*
    name:name _* 
    count:array_size? _* 
    init: init? _* 
{ return {
    name: name,
    pointer_levels: pointer_levels ? pointer_levels : 0,
    array_size: count,
    init: init
}; }
   

pointer_levels = "*"+ { return text().length; }
array_size = "[" n:integer "]" { return n }

init = "=" _* v:initvalue { return v; }
initvalue = integer / null / true / false

_ = [ \t\n\r]
newline = [\n\r]

true = ("true" / "TRUE") { return 1; }
false = ("false" / "FALSE") { return 0; }
null = ("null" / "NULL" / "nullptr") { return 0; }
integer = ("0" / ([1-9] [0-9]*)) { return +text() }

name_firstchar = [a-zA-Z_]
name_otherchar = [0-9a-zA-Z_]
name = name_firstchar name_otherchar* { return text() }

typename_firstchar = [a-zA-Z_:]
typename_otherchar = [0-9a-zA-Z_:]
typename_template = "<" _* typename (_* "," _* typename)* _* ">" { return text() }
typename = typename_firstchar typename_otherchar* typename_template? { return text() }