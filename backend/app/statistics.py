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
        "three_point_percentage": round(threep_percent, 1),
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


def calculate_team_stats(team_form_stats):
    num_games = len(team_form_stats)
    if not num_games:
        return {}

    total_fg_made = sum(row["field_goals_made"] for row in team_form_stats)
    total_fg_attempted = sum(row["field_goals_attempted"] for row in team_form_stats)

    total_3p_made = sum(row["three_pointers_made"] for row in team_form_stats)
    total_3p_attempted = sum(row["three_pointers_attempted"] for row in team_form_stats)

    total_ft_made = sum(row["free_throws_made"] for row in team_form_stats)
    total_ft_attempted = sum(row["free_throws_attempted"] for row in team_form_stats)

    total_points = sum(row["team_score"] for row in team_form_stats)
    total_wins = sum(row["win"] for row in team_form_stats)
    total_opponent_points = sum(row["opponent_score"] for row in team_form_stats)

    total_assists = sum(row.get("assists", 0) for row in team_form_stats)
    total_blocks = sum(row.get("blocks", 0) for row in team_form_stats)
    total_steals = sum(row.get("steals", 0) for row in team_form_stats)
    total_turnovers = sum(row.get("turnovers", 0) for row in team_form_stats)
    total_rebounds = sum(row.get("rebounds_total", 0) for row in team_form_stats)
    total_fouls = sum(row.get("fouls_personal", 0) for row in team_form_stats)

    fg_percentage = round((total_fg_made / total_fg_attempted) * 100, 1) if total_fg_attempted else 0
    three_pt_percentage = round((total_3p_made / total_3p_attempted) * 100, 1) if total_3p_attempted else 0
    ft_percentage = round((total_ft_made / total_ft_attempted) * 100, 1) if total_ft_attempted else 0
    ppg = round(total_points / num_games, 1)
    win_percentage = round((total_wins / num_games) * 100, 1)
    opponent_ppg = round(total_opponent_points / num_games, 1)

    return {
        "field_goal_percentage": fg_percentage,
        "three_point_percentage": three_pt_percentage,
        "free_throw_percentage": ft_percentage,
        "points_per_game": ppg,
        "opponent_points_per_game": opponent_ppg,
        "win_percentage": win_percentage,
        "assists_per_game": round(total_assists / num_games, 1),
        "blocks_per_game": round(total_blocks / num_games, 1),
        "steals_per_game": round(total_steals / num_games, 1),
        "turnovers_per_game": round(total_turnovers / num_games, 1),
        "rebounds_per_game": round(total_rebounds / num_games, 1),
        "personal_fouls_per_game": round(total_fouls / num_games, 1)
    }