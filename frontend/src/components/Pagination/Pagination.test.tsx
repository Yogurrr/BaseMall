import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('totalPages가 1 이하면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <Pagination page={0} totalPages={1} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('totalPages만큼 1부터 시작하는 페이지 번호 버튼을 렌더링한다', () => {
    render(<Pagination page={0} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('페이지 번호 버튼을 클릭하면 0-indexed 페이지로 onChange를 호출한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={0} totalPages={3} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '2' }));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('첫 페이지에서는 "이전" 버튼이 비활성화된다', () => {
    render(<Pagination page={0} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
  });

  it('마지막 페이지에서는 "다음" 버튼이 비활성화된다', () => {
    render(<Pagination page={2} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('"다음" 버튼을 클릭하면 다음 페이지로 onChange를 호출한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={0} totalPages={3} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
