# ICK 자율성과지표 성과관리 페이지

전문대학혁신지원사업발전협의회 자율성과지표(4개 지표, 11개 세부지표)의 목표 대비 달성 현황을 보여주는 정적 웹페이지입니다.
**로그인, 접속코드, 수정 PIN이 없습니다.** 주소를 아는 사람은 누구나 볼 수 있습니다.

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 페이지 |
| `css/style.css` | 디자인 (로고 색상, 일반/다크 모드) |
| `js/app.js` | 계산·도넛 그래프·표 그리기 |
| `js/d3.v7.9.0.min.js` | 그래프 라이브러리 (포함되어 있어 별도 설치 불필요) |
| `data/data.js` | **수치 데이터 — 값을 바꿀 때는 이 파일만 수정** |
| `assets/logo.png` | 협의회 로고 |
| `netlify.toml` | Netlify 배포 설정 |

## 배포 방법 (GitHub + Netlify)

1. GitHub에서 새 저장소를 만듭니다 (예: `ick-performance`).
2. 이 폴더의 파일을 모두 저장소에 올립니다.
   - 웹에서: 저장소 화면 → **Add file → Upload files** → 폴더 안의 파일·폴더를 끌어다 놓기 → **Commit changes**
   - 또는 명령어: `git init && git add . && git commit -m "first" && git branch -M main && git remote add origin <저장소 주소> && git push -u origin main`
3. [Netlify](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → 저장소 선택
4. 설정 화면에서 Build command는 비워 두고, Publish directory는 `.` 그대로 두고 **Deploy** 를 누릅니다.
5. 발급된 주소(`https://○○○.netlify.app`)로 접속합니다. **Site configuration → Change site name** 에서 주소 이름을 바꿀 수 있습니다.

이후 GitHub에 파일을 수정해 올리면 Netlify가 자동으로 다시 배포합니다(1분 내외).

> 공개 설정 확인: Netlify의 **Site configuration → Access & security** 에서 Password protection / Visitor access가 꺼져 있어야 누구나 접속할 수 있습니다(기본값은 꺼짐).

## 수치 수정 방법

`data/data.js`를 GitHub 웹에서 열고 연필(✏️) 아이콘으로 수정한 뒤 **Commit changes** 를 누르면 됩니다.

- `meta.asOf` : 중간 집계 기준 (예: `"2026학년도 3분기"`)
- `meta.updated` : 데이터 갱신일
- `indexSummary` : 지표별 `base`(기준값), `t1`·`t2`·`t3`(연차별 목표), `a1`(1차 실적)
- `components` : 세부지표별 `t1`·`t2`·`t3`(목표), `a1`(1차 실적), **`q2`(현재 중간 집계 값)**, `flag`(확인 사항 문구)
  - 값이 아직 없으면 `null` 로 둡니다. 그 지표의 현재 지수는 '입력 대기'로 표시됩니다.
  - 예: 재학생 수 유지율이 확정되면 `"q2": null` → `"q2": 91.5`
- `issues` : 데이터 점검 사항 표

지수·달성도·진척률·평균은 페이지가 자동으로 계산합니다.

- 지수 = Σ(세부 값 ÷ 3차년도 목표 × 100 × 가중치)
- 달성도 = 실적 ÷ 목표 × 100
- 진척률 = 현재 지수 ÷ 2차 목표 × 100

## 내 컴퓨터에서 미리 보기

`index.html`을 더블클릭하면 브라우저에서 바로 열립니다(인터넷 연결 시 글꼴까지 적용).
