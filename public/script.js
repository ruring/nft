// 서버로부터 데이터를 받아와서 동적으로 HTML 생성
fetch('/nftlists')
  .then(response => response.json())
  .then(data => {
    const aboutlistElement = document.getElementById('aboutlist');
    // 동적으로 생성된 HTML 삽입
    aboutlistElement.innerHTML = data.html;
  });

