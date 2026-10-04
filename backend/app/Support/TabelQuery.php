<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

class TabelQuery
{
    private const TOTAL_COUNT_ALIAS = '__total_count';

    private const TOTAL_COUNT_SQL = 'COUNT(*) OVER () AS ' . self::TOTAL_COUNT_ALIAS;

    /**
     * @var array<string, callable(Builder, mixed): void>
     */
    private array $filters = [];

    /**
     * @param  array<string, callable(Builder, mixed): void>  $filters
     */
    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function filter(string $key, callable $constraint): self
    {
        $this->filters[$key] = $constraint;

        return $this;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{data: \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Database\Eloquent\Model>, total: int, page: int, per_page: int, last_page: int}
     */
    public function paginate(Builder $query, array $params, int $defaultPerPage = 10, int $maxPerPage = 100): array
    {
        foreach ($this->filters as $key => $constraint) {
            if (array_key_exists($key, $params) && $params[$key] !== '' && $params[$key] !== null) {
                $constraint($query, $params[$key]);
            }
        }

        $perPage = min($maxPerPage, max(1, (int) ($params['per_page'] ?? $defaultPerPage)));
        $page = max(1, (int) ($params['page'] ?? 1));

        $query->selectRaw(self::TOTAL_COUNT_SQL);

        $data = $query->forPage($page, $perPage)->get();
        $total = $data->isEmpty() ? (clone $query)->count() : (int) $data->first()->getAttributes()[self::TOTAL_COUNT_ALIAS];

        foreach ($data as $row) {
            $row->offsetUnset(self::TOTAL_COUNT_ALIAS);
        }

        return [
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => $perPage > 0 ? (int) ceil($total / $perPage) : 1,
        ];
    }
}