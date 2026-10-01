# 당근 장난감 사냥

추천 장난감 10종을 강남·서초·송파 당근 매물과 맞춰 보고, 붙여넣은 글을 판정해 구매 후보를 고르는 정적 웹앱입니다.
서버·빌드 없이 `index.html` 한 장으로 동작하며 데이터(상한가, 구매 후보)는 브라우저 localStorage에 저장됩니다.

## GitHub Pages 배포 (웹에서)
1. GitHub에서 새 저장소 `toy-hunter` 생성 (Public)
2. **Add file → Upload files** 로 이 폴더의 파일 전체를 올리고 Commit
   (`.nojekyll` 같은 점(.) 파일도 포함)
3. **Settings → Pages → Build and deployment**
   - Source: `Deploy from a branch`
   - Branch: `main` / `/(root)` → Save
4. 1~2분 뒤 `https://<사용자명>.github.io/toy-hunter/` 에서 확인

## 명령어로 배포
```bash
cd toy-hunter
git init -b main
git add .
git commit -m "init: 당근 장난감 사냥"
git remote add origin https://github.com/<사용자명>/toy-hunter.git
git push -u origin main
```
이후 3단계(Pages 설정)만 하면 됩니다.

## 구성
- `index.html` 앱 전체 (HTML·CSS·JS)
- `manifest.webmanifest`, `icon.svg` 홈 화면에 추가할 때 쓰는 앱 정보와 아이콘
- `.nojekyll` GitHub Pages가 파일을 그대로 서비스하도록 설정

## 수정 포인트 (`index.html` 상단 스크립트)
- `TOYS` 장난감 목록, 검색어(`q`), 인식 키워드(`kw`), 초기 상한가(`cap`)
- `SPOTS` 거래 장소별 근처 동네
- `GU` 구별 당근 지역 ID (강남구-381, 서초구-362, 송파구-404)

## 한계
당근은 외부 앱이 목록을 읽어 가는 공개 API가 없어서, 검색 링크로 당근을 열고 글을 붙여넣어 판정하는 방식입니다.

## 기기 간 동기화 (Cloudflare Worker + KV)
`worker/` 폴더가 동기화 서버입니다. 같은 PIN(숫자 6~12자리)을 입력한 기기끼리 상한가·구매 후보·선택값이 합쳐집니다.

```bash
cd worker
npx wrangler kv namespace create TOY_KV      # 출력된 id를 wrangler.toml에 입력
npx wrangler deploy                          # 출력된 workers.dev 주소를 확인
```
배포 후 `index.html` 상단의 `const API=""` 에 Worker 주소를 넣고 다시 커밋하세요.
PIN은 서버에 해시로만 저장되며, 데이터에는 상한가와 구매 후보 정도만 들어갑니다.
