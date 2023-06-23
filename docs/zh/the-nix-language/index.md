## Nix 语言入门


Nix 语言是 Nix 包管理器的基础，要想玩得转 NixOS 与 Nix Flakes，享受到它们带来的诸多好处，就必须学会这门语言。

Nix 是一门比较简单的函数式语言，在已有一定编程基础的情况下，过一遍这些语法用时应该在 2 个小时以内，本文假设你具有一定编程基础（也就是说写得不会很细）。

这一节主要包含如下内容：

1. 数据类型
2. let...in... with inherit 等特殊语法
3. 函数的声明与调用语法
4. 内置函数与库函数
5. inputs 的不纯性（Impurities）
6. 用于描述 Build Task 的 Derivation
7. Overriding 与 Overlays
8. ...

先把语法过一遍，有个大概的印象就行，后面需要用到时再根据右侧目录回来复习。

## 1. 基础数据类型一览 {#basic-data-types}

下面通过一个 attribute set （这类似 json 或者其他语言中的 map/dict）来简要说明所有基础数据类型：

```nix
{
  string = "hello";
  integer = 1;
  float = 3.141;
  bool = true;
  null = null;
  list = [ 1 "two" false ];
  attribute-set = {
    a = "hello";
    b = 2;
    c = 2.718;
    d = false;
  }; # comments are supported
}
```

以及一些基础操作符（普通的算术运算、布尔运算就跳过不介绍了）：

```nix
# 列表拼接
[ 1 2 3 ] ++ [ 4 5 6 ] # [ 1 2 3 4 5 6 ]

# 将 // 后面的 attribut set 中的内容，全部更新到 // 前面的 attribute set 中
{ a = 1; b = 2; } // { b = 3; c = 4; } # 结果为 { a = 1; b = 3; c = 4; }

# 逻辑隐含，等同于 !b1 || b2.
bool -> bool
```

## 2. let ... in ... {#let-in}

Nix 的 `let ... in ...` 语法被称作「let 表达式」或者「let 绑定」，它用于创建临时使用的局部变量：

```nix
let
  a = 1;
in
a + a  # 结果是 2
```

let 表达式中的变量只能在 `in` 之后的表达式中使用，理解成临时变量就行。

## 3. attribute set 说明 {#attribute-set}

花括号 `{}` 用于创建 attribute set，也就是 key-value 对的集合，类似于 JSON 中的对象。

attribute set 默认不支持递归引用，如下内容会报错：

```nix
{
  a = 1;
  b = a + 1; # error: undefined variable 'a'
}
```

不过 Nix 提供了 `rec` 关键字（recursive attribute set），可用于创建递归引用的 attribute set：

```nix
rec {
  a = 1;
  b = a + 1; # ok
}
```

在递归引用的情况下，Nix 会按照声明的顺序进行求值，所以如果 `a` 在 `b` 之后声明，那么 `b` 会报错。

可以使用 `.` 操作符来访问 attribute set 的成员：

```nix
let
  a = {
    b = {
      c = 1;
    };
  };
in
a.b.c # 结果是 1
```

`.` 操作符也可直接用于赋值：

```nix
{ a.b.c = 1; }
```

此外 attribute set 还支持一个 has attribute 操作符，它可用于检测 attribute set 中是否包含某个属性，返回 bool 值：

```nix
let
  a = {
    b = {
      c = 1;
    };
  };
in
a?b  # 结果是 true，因为 a.b 这个属性确实存在
```

has attribute 操作符在 nixpkgs 库中常被用于检测处理 `args?system` 等参数，以 `(args?system)` 或 `(! args?system)` 的形式作为函数参数使用（叹号表示对 bool 值取反，是常见 bool 值运算符）。

## 4. with 语句 {#with-statement}

with 语句的语法如下：

```nix
with <attribute-set> ; <expression>
```

`with` 语句会将 `<attribute-set>` 中的所有成员添加到当前作用域中，这样在 `<expression>` 中就可以直接使用 `<attribute-set>` 中的成员了，简化 attribute set 的访问语法，比如：

```nix
let
  a = {
    x = 1;
    y = 2;
    z = 3;
  };
in
with a; [ x y z ]  # 结果是 [ 1 2 3 ], 等价于 [ a.x a.y a.z ]
```

## 5. 继承 inherit ... {#inherit}

`inherit` 语句用于从 attribute set 中继承成员，同样是一个简化代码的语法糖，比如：

```nix
let
  x = 1;
  y = 2;
in
{
  inherit x y;
}  # 结果是 { x = 1; y = 2; }
```

inherit 还能直接从某个 attribute set 中继承成员，语法为 `inherit (<attribute-set>) <member-name>;`，比如：

```nix
let
  a = {
    x = 1;
    y = 2;
    z = 3;
  };
in
{
  inherit (a) x y;
}  # 结果是 { x = 1; y = 2; }
```

## 6. ${ ... } 字符串插值 {#string-interpolation}

`${ ... }` 用于字符串插值，懂点编程的应该都很容易理解这个，比如：

```nix
let
  a = 1;
in
"the value of a is ${a}"  # 结果是 "the value of a is 1"
```

## 7. 文件系统路径 {#file-system-path}

Nix 中不带引号的字符串会被解析为文件系统路径，路径的语法与 Unix 系统相同。

## 8. 搜索路径 {#search-path}

> 请不要使用这个功能，它会导致不可预期的行为。

Nix 会在看到 `<nixpkgs>` 这类三角括号语法时，会在 `NIX_PATH` 环境变量中指定的路径中搜索该路径。

因为环境变量 `NIX_PATH` 是可变更的值，所以这个功能是不纯的，会导致不可预期的行为。

在这里做个介绍，只是为了让你在看到别人使用类似的语法时不至于抓瞎。

## 9. 多行字符串 {#multi-line-string}

多行字符串的语法为 `''`，比如：

```nix
''
  this is a
  multi-line
  string
''
```

## 10. 函数 {#nix-function}

函数的声明语法为：

```nix
<arg1>:
  <body>
```

举几个常见的例子：

```nix
# 单参数函数
a: a + a

# 嵌套函数
a: b: a + b

# 双参数函数
{ a, b }: a + b

# 双参数函数，带默认值。问号后面的是参数的默认值
{ a ? 1, b ? 2 }: a + b

# 带有命名 attribute set 作为参数的函数，并且使用 ... 收集其他可选参数
# 命名 args 与 ... 可选参数通常被一起作为函数的参数定义使用
args@{ a, b, ... }: a + b + args.c
# 如下内容等价于上面的内容,
{ a, b, ... }@args: a + b + args.c

# 但是要注意命名参数仅绑定了输入的 attribute set，默认参数不在其中，举例
let
  f = { a ? 1, b ? 2, ... }@args: args
in
  f {}  # 结果是 {}，也就说明了 args 中包含默认值

# 函数的调用方式就是把参数放在后面，比如下面的 2 就是前面这个函数的参数
a: a + a 2  # 结果是 4

# 还可以给函数命名，不过必须使用 let 表达式
let
  f = a: a + a;
in
  f 2  # 结果是 4
```

### 内置函数 {#built-in-function}

Nix 内置了一些函数，可通过 `builtins.<function-name>` 来调用，比如：

```nix
builtins.add 1 2  # 结果是 3
```

详细的内置函数列表参见 [Built-in Functions - Nix Reference Mannual](https://nixos.org/manual/nix/stable/language/builtins.html)

### import 表达式 {#import-expression}

`import` 表达式以其他 Nix 文件的路径作为参数，返回该 Nix 文件的执行结果。

`import` 的参数如果为文件夹路径，那么会返回该文件夹下的 `default.nix` 文件的执行结果。

举个例子，首先创建一个 `file.nix` 文件：

```shell
$ echo "x: x + 1" > file.nix
```

然后使用 import 执行它：

```nix
import ./file.nix 1  # 结果是 2
```

### pkgs.lib 函数包 {#pkgs-lib}

除了 builtins 之外，Nix 的 nixpkgs 仓库还提供了一个名为 `lib` 的 attribute set，它包含了一些常用的函数，它通常被以如下的形式被使用：

```nix
let
  pkgs = import <nixpkgs> {};
in
pkgs.lib.strings.toUpper "search paths considered harmful"  # 结果是 "SEARCH PATHS CONSIDERED HARMFUL"
```

可以通过 [Nixpkgs Library Functions - Nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#sec-functions-library) 查看 lib 函数包的详细内容。

## 11. 不纯（Impurities） {#impurities}

Nix 语言本身是纯函数式的，是纯的，「纯」是指它就跟数学中的函数一样，同样的输入永远得到同样的输出。

Nix 有两种构建输入，一种是从文件系统路径等输入源中读取文件，另一种是将其他函数作为输入。

**Nix 唯一的不纯之处在这里：从文件系统路径或者其他输入源中读取文件作为构建任务的输入**，这些输入源参数可能没变化，但是文件内容或数据源的返回内容可能会变化，这就会导致输入相同，Nix 函数的输出却可能不同——函数变得不纯了。

> Nix 中的搜索路径与 `builtins.currentSystem` 也是不纯的，但是这两个功能都不建议使用，所以这里略过了。

## 12. Fetchers {#fetchers}

构建输入除了直接来自文件系统路径之外，还可以通过 Fetchers 来获取，Fetcher 是一种特殊的函数，它的输入是一个 attribute set，输出是 Nix Store 中的一个系统路径。

Nix 提供了四个内置的 Fetcher，分别是：

- `builtins.fetchurl`：从 url 中下载文件
- `builtins.fetchTarball`：从 url 中下载 tarball 文件
- `builtins.fetchGit`：从 git 仓库中下载文件
- `builtins.fetchClosure`：从 Nix Store 中获取 Derivation

举例：

```nix
builtins.fetchurl "https://github.com/NixOS/nix/archive/7c3ab5751568a0bc63430b33a5169c5e4784a0ff.tar.gz"
# result example => "/nix/store/7dhgs330clj36384akg86140fqkgh8zf-7c3ab5751568a0bc63430b33a5169c5e4784a0ff.tar.gz"

builtins.fetchTarball "https://github.com/NixOS/nix/archive/7c3ab5751568a0bc63430b33a5169c5e4784a0ff.tar.gz"
# result example(auto unzip the tarball) => "/nix/store/d59llm96vgis5fy231x6m7nrijs0ww36-source"
```

## 13. Derivations {#derivations}

一个构建动作的 Nix 语言描述被称做一个 Derivation，它描述了如何构建一个软件包，它的构建结果是一个 Store Object.

Store Object 的存放路径格式为 `/nix/store/<hash>-<name>`，其中 `<hash>` 是构建结果的 hash 值，`<name>` 是它的名字。路径 hash 值确保了每个构建结果都是唯一的，因此可以多版本共存，而且不会出现依赖冲突的问题。

`/nix/store` 被称为 Store，存放所有的 Store Objects，这个路径被设置为只读，只有 Nix 本身才能修改这个路径下的内容，以保证系统的可复现性。

在 Nix 语言的最底层，一个构建任务就是使用 builtins 中的不纯函数 `derivation` 创建的，我们实际使用的 `stdenv.mkDerivation` 就是它的一个 wrapper，屏蔽了底层的细节，简化了用法。

## 14. if...then...else... {#if-then-else}

if...then...else... 用于条件判断，它是一个有返回值的表达式，语法如下：

```nix
if 3 > 4 then "yes" else "no" # 结果为 "no"
```

也可以与 let...in... 一起使用：

```nix
let
  x = 3;
in
  if x > 4 then "yes" else "no" # 结果为 "no"
```


## 参考

- [Nix language basics - nix.dev](https://nix.dev/tutorials/first-steps/nix-language)