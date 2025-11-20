def calculate_player_summary(player_stats):
    if not player_stats:
        return {
            "games_played": 0,
            "avg_points": 0,
            "avg_assists": 0,
            "avg_rebounds": 0,
            "fg_percent": 0,
            "threep_percent": 0,
            "ft_percent": 0,
        }

    games_played = len(player_stats)
    
    total_points = sum(row["points"] for row in player_stats)
    total_assists = sum(row["assists"] for row in player_stats)
    total_rebounds = sum(row["rebounds_total"] for row in player_stats)

    total_fg_made = sum(row["field_goals_made"] for row in player_stats)
    total_fg_attempted = sum(row["field_goals_attempted"] for row in player_stats)
    total_3p_made = sum(row["three_pointers_made"] for row in player_stats)
    total_3p_attempted = sum(row["three_pointers_attempted"] for row in player_stats)
    total_ft_made = sum(row["free_throws_made"] for row in player_stats)
    total_ft_attempted = sum(row["free_throws_attempted"] for row in player_stats)

    fg_percent = (total_fg_made / total_fg_attempted * 100) if total_fg_attempted else 0
    threep_percent = (total_3p_made / total_3p_attempted * 100) if total_3p_attempted else 0
    ft_percent = (total_ft_made / total_ft_attempted * 100) if total_ft_attempted else 0

    return {
        "games_played": games_played,
        "average_points": round(total_points /games_played, 1),
        "average_assists": round(total_assists /games_played, 1),
        "average_rebounds": round(total_rebounds /games_played, 1),
        "field_goal_percentage": round(fg_percent, 1),
        "three_points_percentage": round(threep_percent, 1),
        "free_throw_percentage": round(ft_percent, 1),
    }


def calculate_clutch_summary(clutch_player_stats):
    total_fg_made = sum(row["field_goals_made"] for row in clutch_player_stats)
    total_fg_attempted = sum(row["field_goals_attempted"] for row in clutch_player_stats)
    total_points = sum(row["points"] for row in clutch_player_stats)
    total_wins = sum(row["win"] for row in clutch_player_stats)
    num_games = len(clutch_player_stats)

    fg_percentage = round((total_fg_made / total_fg_attempted) * 100, 2) if total_fg_attempted > 0 else 0
    ppg = round(total_points / num_games, 2) if num_games > 0 else 0
    win_percentage = round((total_wins / num_games) * 100, 2) if num_games > 0 else 0

    print(f"FG%: {fg_percentage}%")
    print(f"PPG: {ppg}")
    print(f"Win%: {win_percentage}%")

    return {
        "average_points": round(total_points /num_games, 1),
        "field_goal_percentage": round(fg_percentage, 1),
        "win_percentage": round(win_percentage, 1)
    }