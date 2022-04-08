## リリース確認

以下を実行して確認します。

```sh
deno task check
```

* `sample/server.ts` のimport修正
* バージョンの変更
  * `version.ts`

## リリース手順

* `deno run --allow-run tools/settag.ts`
  * `git tag v{VERSION}`
  * `vバージョン` でタグの作成を行う
* push
* Githubのreleaseの追加
