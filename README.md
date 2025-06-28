# 📈 stock-viewer-app

## 1. 프로젝트 개요

**stock-viewer-app**은 실시간 주식 데이터 시각화 및 모니터링을 위한 프론트엔드 애플리케이션입니다. React(TypeScript) 기반으로 개발되었으며, 실시간 소켓 통신 및 JWT 인증 등 다양한 기능을 제공합니다.

> 본 프로젝트는 테스트, 데모, 실거래 아키텍처 구성 연습 목적이며, 실시간 데이터 처리 및 다양한 백엔드 연동을 지원할 수 있도록 설계되었습니다.

---

## 2. 시스템 구조 및 주요 기능

- **실시간 소켓 통신**
  - socket.io를 활용한 실시간 데이터 수신 및 상태 관리
- **JWT 인증/생성**
  - JWTGenerator를 통한 토큰 생성 및 인증 테스트
- **룸/채널 관리**
  - RoomManager를 통한 실시간 채널(룸) 입장/퇴장 및 상태 표시
- **UI/UX**
  - Material-UI 등 최신 UI 라이브러리 적용(적용 중)
- **확장성**
  - 다양한 백엔드 API 연동 및 실시간 데이터 시각화 기능 확장 가능

---

## 3. 폴더 구조

```
stock-viewer-app/
├── public/                # 정적 파일 및 HTML 템플릿
├── src/                   # 소스코드 (React + TypeScript)
│   ├── App.tsx            # 메인 앱 컴포넌트
│   ├── index.tsx          # 엔트리 포인트
│   ├── RoomManager.tsx    # 룸/채널 관리
│   ├── SocketConnectionPanel.tsx # 소켓 연결 패널
│   ├── JWTGenerator.tsx   # JWT 생성/테스트
│   └── ...                # 기타 컴포넌트 및 타입 정의
├── package.json           # 프로젝트 메타/의존성
├── tsconfig.json          # TypeScript 설정
└── README.md              # 프로젝트 설명
```

---

## 4. 환경 변수 및 설정

- **아직 미정**

---

## 5. 실행 방법

1. 의존성 설치

   ```bash
   npm install
   ```

2. 개발 서버 실행

   ```bash
   npm start
   ```

3. (선택) 빌드

   ```bash
   npm run build
   ```

---

## 6. 주요 스크립트/명령어

| 명령어            | 설명                       |
|-------------------|----------------------------|
| npm start         | 개발 서버 실행              |
| npm run build     | 프로덕션 빌드 생성          |
| npm test          | 테스트 실행 (구현 시)        |
| npm run lint      | 린트 검사 (구현 시)          |

---

## 7. 기술 스택

- React (TypeScript)
- socket.io-client
- Material-UI (적용 중)
- 기타: JWT, WebSocket 등

---

## 8. 참고 및 기타

- 본 프로젝트는 프론트엔드 실시간 데이터 시각화 및 실습용으로 설계되었습니다.
- 백엔드 연동, 인증, 실거래 환경 등은 별도 구현이 필요할 수 있습니다.
- 문의/기여/이슈는 GitHub를 통해 남겨주세요.
