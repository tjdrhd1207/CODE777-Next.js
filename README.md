🕵️‍♂️ CODE 777 - Online Board Game
논리적 추론 보드게임 **'코드 777'**의 웹 기반 풀스택 구현 프로젝트입니다.

🛠 기술 스택
Framework: Next.js 14 (App Router)

Styling: Tailwind CSS

Animation: Framer Motion

State Management: Zustand

Icons: Lucide React

📅 작업 로그 (2026-04-19)
1. 프로젝트 기초 공사 완료
Next.js App Router 기반의 디렉토리 구조 설계 (src/app, src/components, src/store 등).

전역 상태 관리를 위한 Zustand 스토어 초기 설정 (useUserStore, useGameStore).

2. UI/UX 개발
메인 화면 (Start Page): Framer Motion을 활용한 애니메이션 타이틀과 메뉴 구성.

로그인 모달 (Login Modal): 모바일/데스크탑 반응형 대응 및 입력 폼 설계.

로비 리스트 (Room List): Grid 레이아웃을 이용한 반응형 방 목록 화면 구현.

게임 대기실 (Game Lobby): [id] 동적 라우팅을 적용한 실시간 대기 공간 UI 설계 (플레이어 목록, 채팅창, 레디 시스템).

3. 주요 해결 이슈
동적 라우팅 해결: /game/[id] 구조를 통해 특정 방 입장이 안 되던 404 에러 해결 및 파라미터 수신 로직 구현.

반응형 최적화: Tailwind CSS의 Breakpoints를 활용하여 모바일 터치 환경과 데스크탑 뷰 최적화.

🚀 다음 할 일 (To-Do)
✅ Phase 1: 실시간 통신 및 데이터베이스
[ ] Socket.io 서버 구축: 방 입장, 준비 상태(Ready), 채팅 실시간 동기화.

[ ] MSSQL 연동: 유저 회원가입/로그인 및 방 생성 정보 DB 저장 API 구현.

[ ] 방 만들기 기능: 방 제목, 인원수 설정이 가능한 모달 로직 완성.

✅ Phase 2: 게임 핵심 로직 (Core Logic)
[ ] 타일 셔플 알고리즘: 28개 타일 랜덤 분배 및 색상/숫자 데이터 생성.

[ ] 정보 비대칭 UI: 나는 못 보고 상대방만 볼 수 있는 '타일 거치대' 컴포넌트 개발.

[ ] 질문 카드 시스템: 1~23번 질문 카드 덱 구현 및 조건별 자동 계산 로직.

✅ Phase 3: 인터랙션 강화
[ ] 추리 보드(Grid): 플레이어가 직접 O/X 표시를 할 수 있는 디지털 추리판 UI.

[ ] 정답 제출 로직: 정답 확인 절차 및 코인 획득/타일 교체 애니메이션.