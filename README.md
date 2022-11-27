![Minirachne](docs/widelogo.png "Minirachne")

# Minirachne

Minirachne is a Web API server made with Deno.

## Need

- `Deno ^v1.20.1`
  - Use [Deno task runner](https://deno.land/manual@v1.20.1/tools/task_runner). (`^v1.20.1`)
  - Use [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern). (`^v1.15`)

## Usage static web server.

```sh
deno run --allow-read --allow-net --allow-env https://raw.githubusercontent.com/Azulamb/minirachne/main/server.ts
```

Start local static web server.

See for options: [server.ts](https://github.com/Azulamb/minirachne/blob/main/server.ts) or `deno run https://raw.githubusercontent.com/Azulamb/minirachne/main/server.ts --help`

### Update

```sh
deno run -r https://raw.githubusercontent.com/Azulamb/minirachne/main/server.ts --help
```

## Sample

### Server

See [sample/server.ts](https://github.com/Azulamb/minirachne/blob/main/sample/server.ts) and [sample/](https://github.com/Azulamb/minirachne/blob/main/sample/)

Exec `deno task sample`

### Deno Deploy

https://deno.com/deploy

+ New Playground.
+ Copy sample code.
  * See [denodeploy/sample.ts](https://github.com/Azulamb/minirachne/tree/main/denodeploy/sample.ts).
+ Save & Deploy.

## Command

* `deno lint`
  * Lint.
* `deno fmt`
  * Format.
* `deno task tests`
  * Test `tests/*.test.ts` .
* `deno task clear`
  * Cache clear.
* `deno task check`
  * Release check.

## TODO

* テストの細分化
  * 現在テストをある程度まとめてやっているので。
* 一番最後にレスポンス制御を入れるか検討

### 1.0にむけて

* addにURLPatternを入れたままにするか検討
* deno doc用のコメント
  * https://doc.deno.land/
  * https://doc.deno.land/https://raw.githubusercontent.com/Azulamb/minirachne/main/mod.ts
