import styled, { css } from 'styled-components';

interface GridProps {
  size?: number;
}

export const SubTitle = styled.h2`
  margin-bottom: 20px;
  margin-top: 30px;
`;

export const Title = styled.h1`
  margin-bottom: 20px;
  margin-top: 0;
`;

export const Grid = styled.div<GridProps>`
  display: grid;
  grid-template-columns: ${({ size = 3 }) => css`repeat(${size}, 1fr)`};
  grid-column-gap: 15px;
  grid-row-gap: 15px;
  justify-content: center;
  margin: 50px auto 0;
  max-width: 960px;

  @media (min-width: 1024px) {
    grid-column-gap: 30px;
    grid-row-gap: 30px;
  }

  ${SubTitle} + & {
    margin-top: 0;
  }
`;

export const GridItem = styled.div`
  h4 {
    margin-top: 0;
    margin-bottom: 20px;
  }

  > div {
    align-items: center;
    display: flex;
    justify-content: center;
    margin-top: auto;
  }

  svg {
    height: auto;
    width: 100%;
  }
`;

export const Wrapper = styled.main`
  font-family: sans-serif;
  padding: 15px;
  text-align: center;
`;
